import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { toStickerFormat } from "@/lib/watermark";

export const runtime = "nodejs";

const schema = z.object({ memeId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = createClient();
  const { data: meme, error } = await supabase
    .from("memes")
    .select("id, image_url, title")
    .eq("id", parsed.data.memeId)
    .single();

  if (error || !meme) {
    return NextResponse.json({ error: "Meme not found." }, { status: 404 });
  }

  const imageResponse = await fetch(meme.image_url);
  if (!imageResponse.ok) {
    return NextResponse.json({ error: "Could not fetch the image." }, { status: 502 });
  }
  const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const sticker = await toStickerFormat(originalBuffer);

  const service = createServiceClient();
  await service.rpc("increment_meme_downloads", { meme_id: meme.id });

  return new NextResponse(sticker, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `attachment; filename="mydpix-sticker-${meme.id.slice(0, 8)}.webp"`,
      "Cache-Control": "no-store",
    },
  });
}
