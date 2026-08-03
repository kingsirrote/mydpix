import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, TOPUP_PRICE_ID } from "@/lib/stripe";
import { isPaidTier } from "@/lib/coins";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to buy coins." }, { status: 401 });
  }

  if (!TOPUP_PRICE_ID) {
    return NextResponse.json(
      { error: "Coin top-ups aren't configured yet — check back shortly." },
      { status: 503 }
    );
  }

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  if (!profile || !isPaidTier(profile.subscription_tier)) {
    return NextResponse.json(
      { error: "Coin top-ups are available for paid plans — upgrade first." },
      { status: 403 }
    );
  }

  let customerId = profile.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await service.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: TOPUP_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/dashboard?topup=true`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { supabase_user_id: user.id, type: "coin_topup" },
  });

  return NextResponse.json({ url: session.url });
}
