import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyWatermark, generateThumbnail } from "@/lib/watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to upload images." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, and WebP images are supported." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image is too large — 8MB max." }, { status: 400 });
  }

  const title = (formData?.get("title") as string | null)?.slice(0, 80) || file.name.slice(0, 80);
  const removeWatermark = formData?.get("removeWatermark") === "true";

  try {
    const supabaseUser = createClient();
    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isPremium = profile?.role === "premium" || profile?.role === "admin";
    const skipWatermark = removeWatermark && isPremium;

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const finalImage = await applyWatermark(originalBuffer, { skip: skipWatermark });
    const thumbnail = await generateThumbnail(finalImage);

    const service = createServiceClient();
    const fileId = nanoid(12);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

    const { error: uploadError } = await service.storage
      .from("memes")
      .upload(`uploaded/${user.id}/${fileId}.${ext}`, finalImage, {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error: thumbError } = await service.storage
      .from("memes")
      .upload(`uploaded/${user.id}/${fileId}-thumb.webp`, thumbnail, {
        contentType: "image/webp",
        upsert: false,
      });
    if (thumbError) throw thumbError;

    const { data: publicUrl } = service.storage.from("memes").getPublicUrl(`uploaded/${user.id}/${fileId}.${ext}`);
    const { data: thumbUrl } = service.storage
      .from("memes")
      .getPublicUrl(`uploaded/${user.id}/${fileId}-thumb.webp`);

    const { data: meme, error: insertError } = await service
      .from("memes")
      .insert({
        owner_id: user.id,
        title,
        source: "uploaded",
        image_url: publicUrl.publicUrl,
        thumbnail_url: thumbUrl.publicUrl,
        watermarked: !skipWatermark,
        // Uploaded content hasn't passed AI moderation, so it stays private
        // to the uploader until an admin approves it for the public library.
        moderation_status: "pending",
        is_public: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ meme });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Could not process your image. Please try again." }, { status: 500 });
  }
}
