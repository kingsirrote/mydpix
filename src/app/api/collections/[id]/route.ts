import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ memeId: z.string().uuid() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid meme id." }, { status: 400 });

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

  const { error } = await supabase
    .from("collection_memes")
    .insert({ collection_id: params.id, meme_id: parsed.data.memeId });

  if (error) return NextResponse.json({ error: "Could not add meme to collection." }, { status: 500 });
  return NextResponse.json({ added: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid meme id." }, { status: 400 });

  const { error } = await supabase
    .from("collection_memes")
    .delete()
    .eq("collection_id", params.id)
    .eq("meme_id", parsed.data.memeId);

  if (error) return NextResponse.json({ error: "Could not remove meme." }, { status: 500 });
  return NextResponse.json({ removed: true });
}
