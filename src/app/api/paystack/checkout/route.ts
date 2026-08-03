import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { initializeTransaction, PLAN_CODES, nairaToKobo } from "@/lib/paystack";
import { TIERS } from "@/lib/coins";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.enum(["tier1", "tier2", "tier3"]),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const planKey = parsed.data.plan;
  const planCode = PLAN_CODES[planKey];

  if (!planCode) {
    return NextResponse.json(
      { error: "Payments aren't configured yet — check back shortly." },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountKobo: nairaToKobo(TIERS[planKey].priceNaira),
      callbackUrl: `${appUrl}/dashboard?upgraded=true`,
      planCode,
      metadata: { supabase_user_id: user.id, plan: planKey },
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error) {
    console.error("Paystack checkout init failed:", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
