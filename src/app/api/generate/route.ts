import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { moderatePrompt } from "@/lib/ai/moderation";
import { buildImagePrompt, suggestStyle, type MemeStyle, type AspectRatio } from "@/lib/ai/promptEngine";
import { generateImageVariations } from "@/lib/ai/openai";
import { applyWatermark, generateThumbnail } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z.string().min(3, "Tell us a bit more about the situation").max(500),
  style: z
    .enum([
      "classic-macro",
      "reaction-face",
      "drake-format",
      "distracted-format",
      "naija-skit",
      "office-meme",
      "wholesome-poster",
    ])
    .optional(),
  aspectRatio: z.enum(["1:1", "4:5", "16:9", "9:16"]).default("1:1"),
  variations: z.number().int().min(1).max(4).default(4),
  removeWatermark: z.boolean().optional().default(false),
});

const FREE_DAILY_LIMIT = 6;
const PREMIUM_DAILY_LIMIT = 100;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to generate memes." }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success: withinBurstLimit } = await checkRateLimit("generate", `${user.id}:${ip}`);
  if (!withinBurstLimit) {
    return NextResponse.json(
      { error: "You're generating a bit too fast. Take a short breather and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { prompt, aspectRatio, variations, removeWatermark } = parsed.data;
  const style: MemeStyle = parsed.data.style ?? suggestStyle(prompt);

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("Profile lookup failed for authenticated user", user.id, profileError);
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const isPremium = profile.role === "premium" || profile.role === "admin";
  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const resetAt = new Date(profile.generation_count_reset_at);
  const now = new Date();
  const needsReset = now.getUTCDate() !== resetAt.getUTCDate() || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;
  const currentCount = needsReset ? 0 : profile.generation_count_today;

  if (currentCount >= dailyLimit) {
    return NextResponse.json(
      {
        error: isPremium
          ? "You've hit today's generation limit. It resets tomorrow."
          : "You've used today's free generations. Upgrade to Premium for a much higher daily limit.",
        limitReached: true,
      },
      { status: 429 }
    );
  }

  const moderation = await moderatePrompt(prompt);
  if (!moderation.allowed) {
    await logGeneration(user.id, prompt, null, style, aspectRatio, variations, "moderated");
    return NextResponse.json(
      { error: "That prompt doesn't meet our content guidelines. Try rephrasing it." },
      { status: 422 }
    );
  }

  const startedAt = Date.now();
  const remaining = Math.min(variations, dailyLimit - currentCount);
  const skipWatermark = removeWatermark && isPremium;

  try {
    const results = await Promise.all(
      Array.from({ length: remaining }, (_, i) =>
        generateImageVariations(
          { prompt: buildImagePrompt({ situation: prompt, style, aspectRatio, variationSeed: i }), aspectRatio },
          1
        ).then((r) => {
          const [first] = r;
          if (!first) throw new Error("Image generation returned no results");
          return first;
        })
      )
    );

    const insertedMemes = [];

    for (const result of results) {
      const finalImage = await applyWatermark(result.buffer, { skip: skipWatermark });
      const thumbnail = await generateThumbnail(finalImage);
      const fileId = nanoid(12);

      const { error: uploadError } = await service.storage
        .from("memes")
        .upload(`generated/${user.id}/${fileId}.png`, finalImage, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;

      const { error: thumbError } = await service.storage
        .from("memes")
        .upload(`generated/${user.id}/${fileId}-thumb.webp`, thumbnail, { contentType: "image/webp", upsert: false });
      if (thumbError) throw thumbError;

      const { data: publicUrl } = service.storage.from("memes").getPublicUrl(`generated/${user.id}/${fileId}.png`);
      const { data: thumbUrl } = service.storage
        .from("memes")
        .getPublicUrl(`generated/${user.id}/${fileId}-thumb.webp`);

      const { data: memeRow, error: insertError } = await service
        .from("memes")
        .insert({
          owner_id: user.id,
          title: prompt.slice(0, 80),
          prompt,
          optimized_prompt: buildImagePrompt({ situation: prompt, style, aspectRatio }),
          style,
          aspect_ratio: aspectRatio,
          source: "ai_generated",
          image_url: publicUrl.publicUrl,
          thumbnail_url: thumbUrl.publicUrl,
          watermarked: !skipWatermark,
          moderation_status: "approved",
          is_public: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      insertedMemes.push(memeRow);
    }

    await service
      .from("profiles")
      .update({
        generation_count_today: needsReset ? insertedMemes.length : currentCount + insertedMemes.length,
        generation_count_reset_at: needsReset ? now.toISOString() : profile.generation_count_reset_at,
        monthly_generation_count: profile.monthly_generation_count + insertedMemes.length,
      })
      .eq("id", user.id);

    await logGeneration(
      user.id,
      prompt,
      insertedMemes[0]?.optimized_prompt ?? null,
      style,
      aspectRatio,
      insertedMemes.length,
      "success",
      Date.now() - startedAt
    );

    return NextResponse.json({ memes: insertedMemes, style, remainingToday: dailyLimit - currentCount - insertedMemes.length });
  } catch (error) {
    console.error("Meme generation failed", error);
    await logGeneration(user.id, prompt, null, style, aspectRatio, variations, "failed", Date.now() - startedAt, String(error));
    return NextResponse.json(
      { error: "We couldn't generate your meme right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}

async function logGeneration(
  userId: string,
  prompt: string,
  optimizedPrompt: string | null,
  style: string,
  aspectRatio: string,
  variations: number,
  status: "success" | "failed" | "moderated",
  latencyMs?: number,
  errorMessage?: string
) {
  const service = createServiceClient();
  await service.from("generation_logs").insert({
    user_id: userId,
    prompt,
    optimized_prompt: optimizedPrompt,
    style,
    aspect_ratio: aspectRatio,
    variations,
    status,
    latency_ms: latencyMs,
    error_message: errorMessage,
    provider: "openai",
  });
}
