import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WATERMARK_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("subscription_tier").eq("id", user.id).single();

  if (profile?.subscription_tier !== "tier3") {
    return NextResponse.json(
      { error: "Custom watermarks are a Tier 3 feature." },
      { status: 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Please upload a PNG or WebP image (transparent background recommended)." }, { status: 400 });
  }

  if (file.size > MAX_WATERMARK_SIZE) {
    return NextResponse.json({ error: "Watermark image is too large — 2MB max." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/png" ? "png" : "webp";
    const path = `watermarks/${user.id}/watermark.${ext}`;

    // upsert:true so re-uploading replaces the existing watermark in place.
    const { error: uploadError } = await service.storage
      .from("memes")
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = service.storage.from("memes").getPublicUrl(path);
    // Cache-bust so the new watermark shows immediately anywhere it's referenced.
    const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

    await service.from("profiles").update({ custom_watermark_url: url }).eq("id", user.id);

    return NextResponse.json({ watermarkUrl: url });
  } catch (error) {
    console.error("Watermark upload failed:", error);
    return NextResponse.json({ error: "Could not upload your watermark. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  await service.from("profiles").update({ custom_watermark_url: null }).eq("id", user.id);

  // Best-effort cleanup of both possible extensions — not fatal if one is missing.
  await service.storage.from("memes").remove([
    `watermarks/${user.id}/watermark.png`,
    `watermarks/${user.id}/watermark.webp`,
  ]);

  return NextResponse.json({ deleted: true });
}
