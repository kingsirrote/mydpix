import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Generation: 6 requests / minute burst guard, independent of daily plan quota. */
export const generationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, "1 m"),
  analytics: true,
  prefix: "mydpix:ratelimit:generate",
});

/** Search: generous, but still guarded against scraping/abuse. */
export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "mydpix:ratelimit:search",
});

/** Auth endpoints: brute-force guard. */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  analytics: true,
  prefix: "mydpix:ratelimit:auth",
});

export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}
