import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  premium_monthly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    name: "Premium",
    interval: "month",
    dailyGenerationLimit: 100,
    removesWatermark: true,
    priorityQueue: true,
  },
  premium_yearly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
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
