import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ role: z.enum(["user", "premium", "admin"]) });

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

  if (user.id === params.id) {
    return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update role." }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
