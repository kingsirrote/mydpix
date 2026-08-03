import Stripe from "stripe";

// Lazily constructed via a Proxy so importing this module never throws when
// STRIPE_SECRET_KEY isn't set yet (e.g. before Stripe is configured, or
// during `next build`, which statically evaluates route modules). The real
// Stripe client is only created the first time a property is actually used.
let realClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!realClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    realClient = new Stripe(key, { apiVersion: "2024-06-20", typescript: true });
  }
  return realClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

/**
 * Subscription plans, priced in Nigerian Naira. Each price ID is a recurring
 * monthly Stripe Price — create these in the Stripe dashboard (or API) and
 * set the corresponding env var. Coin allotments and feature flags live in
 * src/lib/coins.ts (TIERS) since those also drive in-app logic, not just
 * checkout — this map only needs the billing-specific fields.
 */
export const SUBSCRIPTION_PLANS = {
  tier1: {
    priceId: process.env.STRIPE_PRICE_TIER1,
    tier: "tier1" as const,
  },
  tier2: {
    priceId: process.env.STRIPE_PRICE_TIER2,
    tier: "tier2" as const,
  },
  tier3: {
    priceId: process.env.STRIPE_PRICE_TIER3,
    tier: "tier3" as const,
  },
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;

/**
 * One-time coin top-up purchase — a single Stripe Price in "one-off payment"
 * mode, not a subscription. The coin amount granted is read from
 * site_settings.topup_coins_amount (admin-configurable) rather than hardcoded
 * here, so the price and the coin amount can be tuned independently.
 */
export const TOPUP_PRICE_ID = process.env.STRIPE_PRICE_TOPUP;
