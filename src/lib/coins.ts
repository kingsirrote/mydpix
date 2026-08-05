import type { AspectRatio } from "@/lib/ai/promptEngine";
import type { SubscriptionTier } from "@/types/database";

// This module must stay client-safe (no next/headers, no Supabase server
// client) — it's imported directly by client components like SettingsForm
// for tier/cost display. Server-only lookups (e.g. reading admin-configured
// coin costs from the database) live in coins.server.ts instead.

export interface TierConfig {
  label: string;
  priceNaira: number;
  monthlyCoins: number;
  removesWatermark: boolean;
  priorityQueue: boolean;
  canBuyTopUp: boolean;
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    label: "Free",
    priceNaira: 0,
    monthlyCoins: 0,
    removesWatermark: false,
    priorityQueue: false,
    canBuyTopUp: false,
  },
  tier1: {
    label: "Tier 1",
    priceNaira: 1200,
    monthlyCoins: 40,
    removesWatermark: true,
    priorityQueue: false,
    canBuyTopUp: true,
  },
  tier2: {
    label: "Tier 2",
    priceNaira: 4000,
    monthlyCoins: 150,
    removesWatermark: true,
    priorityQueue: true,
    canBuyTopUp: true,
  },
  tier3: {
    label: "Tier 3",
    priceNaira: 10000,
    monthlyCoins: 600,
    removesWatermark: true,
    priorityQueue: true,
    canBuyTopUp: true,
  },
};

export const FREE_DAILY_GENERATION_LIMIT = 3;

/**
 * Coin cost per generated image, based on aspect ratio (square canvases are
 * cheaper for us to generate than portrait/landscape ones). These are the
 * fallback defaults used if the admin-configurable site_settings values
 * (read server-side via getCoinCosts in coins.server.ts) are missing.
 */
export const DEFAULT_COSTS = {
  square: 1,
  portrait: 2,
  landscape: 2,
  upload: 1,
};

export function costForAspectRatio(aspectRatio: AspectRatio, costs: typeof DEFAULT_COSTS): number {
  if (aspectRatio === "1:1") return costs.square;
  if (aspectRatio === "4:5" || aspectRatio === "9:16") return costs.portrait;
  return costs.landscape; // 16:9
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== "free";
}
