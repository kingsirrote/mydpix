import type { AspectRatio } from "@/lib/ai/promptEngine";
import type { SubscriptionTier } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/server";

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
    monthlyCoins: 400,
    removesWatermark: true,
    priorityQueue: true,
    canBuyTopUp: true,
  },
};

export const FREE_DAILY_GENERATION_LIMIT = 3;

/**
 * Coin cost per generated image, based on aspect ratio (square canvases are
 * cheaper for us to generate than portrait/landscape ones). Falls back to
 * these defaults if the admin-configurable site_settings values are missing.
 */
const DEFAULT_COSTS = {
  square: 1,
  portrait: 2,
  landscape: 2,
  upload: 1,
};

export async function getCoinCosts() {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("site_settings")
      .select("key, value")
      .in("key", ["coin_cost_square", "coin_cost_portrait", "coin_cost_landscape", "coin_cost_upload"]);

    const map = new Map((data ?? []).map((row) => [row.key, row.value]));
    return {
      square: Number(map.get("coin_cost_square") ?? DEFAULT_COSTS.square),
      portrait: Number(map.get("coin_cost_portrait") ?? DEFAULT_COSTS.portrait),
      landscape: Number(map.get("coin_cost_landscape") ?? DEFAULT_COSTS.landscape),
      upload: Number(map.get("coin_cost_upload") ?? DEFAULT_COSTS.upload),
    };
  } catch {
    return DEFAULT_COSTS;
  }
}

export function costForAspectRatio(aspectRatio: AspectRatio, costs: typeof DEFAULT_COSTS): number {
  if (aspectRatio === "1:1") return costs.square;
  if (aspectRatio === "4:5" || aspectRatio === "9:16") return costs.portrait;
  return costs.landscape; // 16:9
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== "free";
}
