import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Cancel any active Stripe subscription first so billing doesn't continue
  // after the account is gone.
  const { data: profile } = await service
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      const { stripe } = await import("@/lib/stripe");
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (error) {
      console.error("Failed to cancel subscription during account deletion:", error);
      // Continue with deletion regardless — don't let a billing hiccup block
      // someone's ability to delete their own account.
    }
  }

  // Deleting the auth user cascades to `profiles` and everything referencing
  // it (memes, likes, collections, etc.) via the ON DELETE CASCADE foreign keys.
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Could not delete account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
