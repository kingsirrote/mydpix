import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  is_public: z.boolean().optional().default(false),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("collections")
    .select("*, collection_memes(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load collections." }, { status: 500 });
  return NextResponse.json({ collections: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a collection." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid collection." }, { status: 400 });

  const { data, error } = await supabase
    .from("collections")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not create collection." }, { status: 500 });
  return NextResponse.json({ collection: data });
}
