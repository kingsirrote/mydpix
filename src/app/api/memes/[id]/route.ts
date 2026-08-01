import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.from("memes").select("*").eq("id", params.id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Meme not found." }, { status: 404 });
  }

  // Fire-and-forget view count increment; doesn't block the response.
  const service = createServiceClient();
  service.rpc("increment_meme_view", { meme_id: params.id }).then(() => {});

  return NextResponse.json({ meme: data });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Toggle like
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to like memes." }, { status: 401 });

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("meme_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const service = createServiceClient();

  if (existing) {
    await supabase.from("likes").delete().eq("meme_id", params.id).eq("user_id", user.id);
    await service.rpc("decrement_meme_likes", { meme_id: params.id });
    return NextResponse.json({ liked: false });
  }

  await supabase.from("likes").insert({ meme_id: params.id, user_id: user.id });
  await service.rpc("increment_meme_likes", { meme_id: params.id });
  return NextResponse.json({ liked: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("memes").delete().eq("id", params.id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete meme." }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
