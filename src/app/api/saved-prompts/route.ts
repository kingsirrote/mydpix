import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_prompts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load saved prompts." }, { status: 500 });
  return NextResponse.json({ prompts: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save prompts." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid prompt." }, { status: 400 });

  const { data, error } = await supabase
    .from("saved_prompts")
    .insert({
      user_id: user.id,
      prompt: parsed.data.prompt,
      style: parsed.data.style ?? null,
      aspect_ratio: parsed.data.aspectRatio ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Could not save prompt." }, { status: 500 });
  return NextResponse.json({ savedPrompt: data });
}
