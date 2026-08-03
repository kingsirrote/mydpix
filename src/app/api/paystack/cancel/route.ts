import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { disableSubscription } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("paystack_subscription_code, paystack_email_token")
    .eq("id", user.id)
    .single();

  if (!profile?.paystack_subscription_code || !profile.paystack_email_token) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }

  try {
    await disableSubscription(profile.paystack_subscription_code, profile.paystack_email_token);
  } catch (error) {
    console.error("Failed to disable Paystack subscription:", error);
    return NextResponse.json({ error: "Could not cancel subscription. Please try again." }, { status: 502 });
  }

  // Reflect the change immediately rather than waiting for the
  // subscription.disable webhook, so the UI updates right away.
  await service
    .from("profiles")
    .update({ subscription_tier: "free", subscription_status: "canceled", paystack_subscription_code: null })
    .eq("id", user.id);

  return NextResponse.json({ canceled: true });
}
