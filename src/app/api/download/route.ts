import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { toFormat } from "@/lib/watermark";

export const runtime = "nodejs";

const schema = z.object({
  memeId: z.string().uuid(),
  format: z.enum(["png", "jpg"]).default("png"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meme, error } = await supabase
    .from("memes")
    .select("id, image_url, title, media_type")
    .eq("id", parsed.data.memeId)
    .single();

  if (error || !meme) {
    return NextResponse.json({ error: "Meme not found." }, { status: 404 });
  }

  if (meme.media_type === "video") {
    return NextResponse.json(
      { error: "Video memes download as-is — use the direct download link instead of PNG/JPG conversion." },
      { status: 400 }
    );
  }

  const imageResponse = await fetch(meme.image_url);
  if (!imageResponse.ok) {
    return NextResponse.json({ error: "Could not fetch the image." }, { status: 502 });
  }
  const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const converted = await toFormat(originalBuffer, parsed.data.format);

  const service = createServiceClient();
  await service.from("downloads").insert({
    user_id: user?.id ?? null,
    meme_id: meme.id,
    format: parsed.data.format,
  });
  await service.rpc("increment_meme_downloads", { meme_id: meme.id });

  return new NextResponse(converted, {
    headers: {
      "Content-Type": parsed.data.format === "jpg" ? "image/jpeg" : "image/png",
      "Content-Disposition": `attachment; filename="mydpix-${meme.id.slice(0, 8)}.${parsed.data.format}"`,
      "Cache-Control": "no-store",
    },
  });
}
