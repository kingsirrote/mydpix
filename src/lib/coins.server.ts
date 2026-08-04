import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_COSTS } from "@/lib/coins";

/**
 * Reads admin-configurable coin costs from site_settings, falling back to
 * DEFAULT_COSTS if anything's missing. Server-only (touches the database) —
 * import this from route handlers and server components, never from client
 * components (import the plain constants/helpers from coins.ts there instead).
 */
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
