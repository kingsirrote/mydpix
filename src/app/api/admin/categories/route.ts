import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
});

async function assertAdmin(userId: string) {
  const service = createServiceClient();
  const { data } = await service.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await assertAdmin(user.id))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const service = createServiceClient();
  const slug = slugify(parsed.data.name);

  const { data: maxSort } = await service
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await service
    .from("categories")
    .insert({
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sort_order: (maxSort?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "A category with a similar name already exists." : "Could not create category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
}
