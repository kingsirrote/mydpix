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

export const PLANS = {
  premium_monthly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    name: "Premium",
    interval: "month",
    dailyGenerationLimit: 100,
    removesWatermark: true,
    priorityQueue: true,
  },
  premium_yearly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    name: "Premium (Yearly)",
    interval: "year",
    dailyGenerationLimit: 100,
    removesWatermark: true,
    priorityQueue: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const FREE_PLAN = {
  name: "Free",
  dailyGenerationLimit: 6,
  removesWatermark: false,
  priorityQueue: false,
};
