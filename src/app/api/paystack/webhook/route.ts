import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, PLAN_CODES } from "@/lib/paystack";
import { createServiceClient } from "@/lib/supabase/server";
import { TIERS } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

export const runtime = "nodejs";

function resolveTierFromPlanCode(planCode: string | null | undefined): SubscriptionTier | null {
  if (!planCode) return null;
  const entry = (Object.entries(PLAN_CODES) as [SubscriptionTier, string | undefined][]).find(
    ([, code]) => code === planCode
  );
  return entry?.[0] ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature");
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("Paystack webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const service = createServiceClient();

  try {
    switch (event.event) {
      // One-time top-up purchase OR the very first charge on a new subscription.
      case "charge.success": {
        const data = event.data;
        const metadata = data.metadata ?? {};

        if (metadata.type === "coin_topup" && metadata.supabase_user_id) {
          const { data: settingRow } = await service
            .from("site_settings")
            .select("value")
            .eq("key", "topup_coins_amount")
            .single();
          const topUpAmount = Number(settingRow?.value ?? 100);
          await service.rpc("credit_coins", {
            p_user_id: metadata.supabase_user_id,
            p_amount: topUpAmount,
            p_reason: "topup_purchase",
          });
          break;
        }

        // Initial subscription charge — metadata should still be present here
        // since this is the transaction we initialized directly (unlike
        // auto-renewal charges, which Paystack triggers internally and won't
        // carry our custom metadata — those are handled via invoice.update below).
        if (metadata.supabase_user_id && metadata.plan) {
          const plan = metadata.plan as SubscriptionTier;
          await service
            .from("profiles")
            .update({
              subscription_tier: plan,
              subscription_status: "active",
              paystack_customer_code: data.customer?.customer_code ?? null,
            })
            .eq("id", metadata.supabase_user_id);
          await service.rpc("refresh_monthly_coins", {
            p_user_id: metadata.supabase_user_id,
            p_new_balance: TIERS[plan]?.monthlyCoins ?? 0,
          });
        }
        break;
      }

      // Fired right after the first successful plan charge — the authoritative
      // source for the subscription_code + email_token needed to cancel later.
      case "subscription.create": {
        const data = event.data;
        const customerCode = data.customer?.customer_code;
        const planCode = data.plan?.plan_code;
        const tier = resolveTierFromPlanCode(planCode);

        if (customerCode) {
          const update: Record<string, unknown> = {
            paystack_subscription_code: data.subscription_code,
            paystack_email_token: data.email_token,
          };
          if (tier) update.subscription_tier = tier;

          await service.from("profiles").update(update).eq("paystack_customer_code", customerCode);
        }
        break;
      }

      // Subscription renewal payment recorded. NOTE: verify this field shape
      // against a real webhook log in Paystack's dashboard once connected —
      // written defensively against documented payload shapes, but Paystack's
      // exact structure should be confirmed with a live test transaction.
      case "invoice.update": {
        const data = event.data;
        if (data.status === "success" || data.paid === true) {
          const subscriptionCode = data.subscription?.subscription_code ?? data.subscription_code;
          const customerCode = data.customer?.customer_code;

          const query = service.from("profiles").select("id, subscription_tier");
          const { data: profile } = subscriptionCode
            ? await query.eq("paystack_subscription_code", subscriptionCode).single()
            : customerCode
              ? await query.eq("paystack_customer_code", customerCode).single()
              : { data: null };

          if (profile) {
            const tier = profile.subscription_tier as SubscriptionTier;
            await service.rpc("refresh_monthly_coins", {
              p_user_id: profile.id,
              p_new_balance: TIERS[tier]?.monthlyCoins ?? 0,
            });
          }
        }
        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const data = event.data;
        const subscriptionCode = data.subscription_code;
        if (subscriptionCode) {
          await service
            .from("profiles")
            .update({ subscription_tier: "free", subscription_status: "canceled", paystack_subscription_code: null })
            .eq("paystack_subscription_code", subscriptionCode);
        }
        break;
      }

      case "invoice.payment_failed": {
        const data = event.data;
        const customerCode = data.customer?.customer_code;
        if (customerCode) {
          await service
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Error processing Paystack webhook:", error, event.event);
    // Still return 200 so Paystack doesn't endlessly retry an event we've
    // already logged — the error is visible in Vercel's function logs.
  }

  return NextResponse.json({ received: true });
}
