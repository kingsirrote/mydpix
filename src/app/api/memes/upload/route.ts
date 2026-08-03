import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyWatermark, generateThumbnail } from "@/lib/watermark";
import { TIERS, FREE_DAILY_GENERATION_LIMIT, getCoinCosts, isPaidTier } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

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

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const tier = profile.subscription_tier as SubscriptionTier;
  const tierConfig = TIERS[tier];
  const paid = isPaidTier(tier);
  const costs = await getCoinCosts();
  const now = new Date();

  if (paid) {
    if (profile.coin_balance < costs.upload) {
      return NextResponse.json(
        {
          error: tierConfig.canBuyTopUp
            ? `You need ${costs.upload} coin${costs.upload > 1 ? "s" : ""} to upload — buy a top-up or wait for your monthly refresh.`
            : "You're out of coins for this month.",
          coinsExhausted: true,
        },
        { status: 429 }
      );
    }
  } else {
    const resetAt = new Date(profile.generation_count_reset_at);
    const needsReset =
      now.getUTCDate() !== resetAt.getUTCDate() || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;
    const currentCount = needsReset ? 0 : profile.generation_count_today;
    if (currentCount >= FREE_DAILY_GENERATION_LIMIT) {
      return NextResponse.json(
        { error: "You've used today's free uploads/generations. Upgrade to a paid plan.", limitReached: true },
        { status: 429 }
      );
    }
  }

  try {
    const skipWatermark = removeWatermark && tierConfig.removesWatermark;

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const finalImage = await applyWatermark(originalBuffer, { skip: skipWatermark });
    const thumbnail = await generateThumbnail(finalImage);

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

    let coinsRemaining: number | null = null;
    if (paid) {
      const { data: spendResult } = await service.rpc("spend_coins", {
        p_user_id: user.id,
        p_amount: costs.upload,
        p_reason: "upload",
        p_meme_id: meme.id,
      });
      coinsRemaining = spendResult?.[0]?.new_balance ?? profile.coin_balance - costs.upload;
    } else {
      const resetAt = new Date(profile.generation_count_reset_at);
      const needsReset =
        now.getUTCDate() !== resetAt.getUTCDate() || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;
      const currentCount = needsReset ? 0 : profile.generation_count_today;
      await service
        .from("profiles")
        .update({
          generation_count_today: needsReset ? 1 : currentCount + 1,
          generation_count_reset_at: needsReset ? now.toISOString() : profile.generation_count_reset_at,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ meme, coinsRemaining });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Could not process your image. Please try again." }, { status: 500 });
  }
}
