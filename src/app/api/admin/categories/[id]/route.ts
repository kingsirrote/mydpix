import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(300).nullable().optional(),
  sort_order: z.number().int().optional(),
});

async function assertAdmin(userId: string) {
  const service = createServiceClient();
  const { data } = await service.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("categories")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await assertAdmin(user.id))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const service = createServiceClient();
  const { error } = await service.from("categories").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: "Could not delete category." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
