import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/stripe";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.enum(["tier1", "tier2", "tier3"]),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const planKey: SubscriptionPlanKey = parsed.data.plan;
  const plan = SUBSCRIPTION_PLANS[planKey];

  if (!plan.priceId) {
    return NextResponse.json(
      { error: "Payments aren't configured yet — check back shortly." },
      { status: 503 }
    );
  }

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("*").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id ?? undefined;
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
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { supabase_user_id: user.id, plan: planKey },
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan: planKey },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
