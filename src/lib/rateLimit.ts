import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily constructed so importing this module never throws — Next.js evaluates
// route modules during `next build` ("Collecting page data"), which would
// otherwise fail the build on any environment missing Upstash credentials
// (e.g. before they've been configured yet, or in CI).
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

const limiters: { generate: Ratelimit | null; search: Ratelimit | null; auth: Ratelimit | null } = {
  generate: null,
  search: null,
  auth: null,
};

/** Generation: 6 requests / minute burst guard, independent of daily plan quota. */
function generationLimiter(): Ratelimit {
  if (!limiters.generate) {
    limiters.generate = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(6, "1 m"),
      analytics: true,
      prefix: "mydpix:ratelimit:generate",
    });
  }
  return limiters.generate;
}

/** Search: generous, but still guarded against scraping/abuse. */
function searchLimiter(): Ratelimit {
  if (!limiters.search) {
    limiters.search = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "mydpix:ratelimit:search",
    });
  }
  return limiters.search;
}

/** Auth endpoints: brute-force guard. */
function authLimiter(): Ratelimit {
  if (!limiters.auth) {
    limiters.auth = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      analytics: true,
      prefix: "mydpix:ratelimit:auth",
    });
  }
  return limiters.auth;
}

export type RateLimitKind = "generate" | "search" | "auth";

const LIMITER_FACTORIES: Record<RateLimitKind, () => Ratelimit> = {
  generate: generationLimiter,
  search: searchLimiter,
  auth: authLimiter,
};

/**
 * Checks a rate limit for the given kind + identifier. If Upstash isn't
 * configured (e.g. not set up yet in this environment), fails OPEN — allows
 * the request through rather than 500ing every route that depends on it.
 * This only affects abuse-prevention headroom, never core functionality.
 */
export async function checkRateLimit(kind: RateLimitKind, identifier: string) {
  try {
    const { success, limit, remaining, reset } = await LIMITER_FACTORIES[kind]().limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.warn(`Rate limiting unavailable (${kind}), allowing request through:`, error);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
