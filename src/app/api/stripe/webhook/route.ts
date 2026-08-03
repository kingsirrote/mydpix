import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { TIERS } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

export const runtime = "nodejs";

// Stripe webhooks need the raw body for signature verification, so this route
// must be excluded from any body-parsing middleware (already excluded in middleware.ts matcher).
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const service = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // One-time coin top-up purchase.
      if (session.mode === "payment" && session.metadata?.type === "coin_topup") {
        const userId = session.metadata.supabase_user_id;
        if (userId) {
          const { data: settingRow } = await service
            .from("site_settings")
            .select("value")
            .eq("key", "topup_coins_amount")
            .single();
          const topUpAmount = Number(settingRow?.value ?? 100);
          await service.rpc("credit_coins", {
            p_user_id: userId,
            p_amount: topUpAmount,
            p_reason: "topup_purchase",
          });
        }
        break;
      }

      // New subscription checkout.
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as SubscriptionTier | undefined;
      if (userId && plan && session.subscription) {
        const monthlyCoins = TIERS[plan]?.monthlyCoins ?? 0;
        await service
          .from("profiles")
          .update({
            subscription_tier: plan,
            subscription_status: "active",
            stripe_subscription_id: String(session.subscription),
          })
          .eq("id", userId);
        await service.rpc("refresh_monthly_coins", { p_user_id: userId, p_new_balance: monthlyCoins });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      const plan = subscription.metadata?.plan as SubscriptionTier | undefined;
      const status = mapStripeStatus(subscription.status);
      if (userId) {
        await service
          .from("profiles")
          .update({
            subscription_status: status,
            ...(plan && (status === "active" || status === "trialing") ? { subscription_tier: plan } : {}),
            ...(status === "canceled" || status === "none" ? { subscription_tier: "free" } : {}),
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (userId) {
        await service
          .from("profiles")
          .update({ subscription_tier: "free", subscription_status: "canceled", stripe_subscription_id: null })
          .eq("id", userId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // Only subscription renewals refresh coins — one-time top-up purchases
      // don't create a Stripe Invoice object, so this never double-credits those.
      if (invoice.subscription) {
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const { data: profile } = await service
            .from("profiles")
            .select("id, subscription_tier")
            .eq("stripe_customer_id", customerId)
            .single();
          if (profile) {
            const tier = profile.subscription_tier as SubscriptionTier;
            const monthlyCoins = TIERS[tier]?.monthlyCoins ?? 0;
            await service.rpc("refresh_monthly_coins", { p_user_id: profile.id, p_new_balance: monthlyCoins });
          }
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await service.from("profiles").update({ subscription_status: "past_due" }).eq("stripe_customer_id", customerId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "trialing" | "past_due" | "canceled" | "none" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}
