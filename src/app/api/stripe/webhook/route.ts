import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

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
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        await service
          .from("profiles")
          .update({
            role: "premium",
            subscription_status: "active",
            stripe_subscription_id: String(session.subscription),
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      const status = mapStripeStatus(subscription.status);
      if (userId) {
        await service
          .from("profiles")
          .update({
            subscription_status: status,
            role: status === "active" || status === "trialing" ? "premium" : "user",
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
          .update({ role: "user", subscription_status: "canceled", stripe_subscription_id: null })
          .eq("id", userId);
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
