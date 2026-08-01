import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ key: z.string(), value: z.unknown() });

async function assertAdmin(userId: string) {
  const service = createServiceClient();
  const { data } = await service.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

export async function GET() {
  const service = createServiceClient();
  const { data } = await service.from("site_settings").select("*");
  return NextResponse.json({ settings: data });
}

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await assertAdmin(user.id))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting." }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from("site_settings")
    .upsert({ key: parsed.data.key, value: parsed.data.value, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: "Could not save setting." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
