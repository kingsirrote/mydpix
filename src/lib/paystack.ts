import crypto from "crypto";
import type { SubscriptionTier } from "@/types/database";

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set.");
  return key;
}

async function paystackFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok || body.status === false) {
    throw new Error(body.message ?? `Paystack request failed (${response.status})`);
  }
  return body;
}

/**
 * Recurring subscription plan codes — created once in the Paystack dashboard
 * (or via their API) for each tier, monthly interval, priced in Naira. Coin
 * allotments per tier live in src/lib/coins.ts (TIERS), decoupled from billing.
 */
export const PLAN_CODES: Record<Exclude<SubscriptionTier, "free">, string | undefined> = {
  tier1: process.env.PAYSTACK_PLAN_TIER1,
  tier2: process.env.PAYSTACK_PLAN_TIER2,
  tier3: process.env.PAYSTACK_PLAN_TIER3,
};

export interface InitializeTransactionInput {
  email: string;
  amountKobo: number;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  planCode?: string;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Starts a Paystack transaction. For subscriptions, pass `planCode` — Paystack
 * automatically creates the recurring subscription after the first successful
 * charge on that plan. For one-off charges (coin top-ups), omit it.
 */
export async function initializeTransaction({
  email,
  amountKobo,
  callbackUrl,
  metadata,
  planCode,
}: InitializeTransactionInput): Promise<InitializeTransactionResult> {
  const body = await paystackFetch<{
    data: { authorization_url: string; access_code: string; reference: string };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: "NGN",
      callback_url: callbackUrl,
      metadata,
      ...(planCode ? { plan: planCode } : {}),
    }),
  });

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  };
}

export interface VerifyTransactionResult {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amount: number;
  customerCode: string;
  metadata: Record<string, unknown> | null;
  planCode: string | null;
  subscriptionCode: string | null;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const body = await paystackFetch<{
    data: {
      status: string;
      reference: string;
      amount: number;
      customer: { customer_code: string };
      metadata: Record<string, unknown> | null;
      plan?: string | { plan_code: string } | null;
      subscription_code?: string | null;
    };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  const plan = body.data.plan;
  return {
    status: body.data.status,
    reference: body.data.reference,
    amount: body.data.amount,
    customerCode: body.data.customer.customer_code,
    metadata: body.data.metadata,
    planCode: typeof plan === "string" ? plan : plan?.plan_code ?? null,
    subscriptionCode: body.data.subscription_code ?? null,
  };
}

export async function disableSubscription(code: string, token: string): Promise<void> {
  await paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token }),
  });
}

/**
 * Verifies the `x-paystack-signature` header: HMAC-SHA512 of the raw request
 * body, keyed with the Paystack secret key.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  return hash === signature;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
