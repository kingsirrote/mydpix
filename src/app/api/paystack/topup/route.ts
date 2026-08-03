import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { initializeTransaction, nairaToKobo } from "@/lib/paystack";
import { isPaidTier } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Sign in to buy coins." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  if (!profile || !isPaidTier(profile.subscription_tier as SubscriptionTier)) {
    return NextResponse.json(
      { error: "Coin top-ups are available for paid plans — upgrade first." },
      { status: 403 }
    );
  }

  const { data: priceSetting } = await service
    .from("site_settings")
    .select("value")
    .eq("key", "topup_price_naira")
    .single();
  const priceNaira = Number(priceSetting?.value ?? 2500);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountKobo: nairaToKobo(priceNaira),
      callbackUrl: `${appUrl}/dashboard?topup=true`,
      metadata: { supabase_user_id: user.id, type: "coin_topup" },
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error) {
    console.error("Paystack top-up init failed:", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
