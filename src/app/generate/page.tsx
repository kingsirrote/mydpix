import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GenerateTabs } from "@/components/GenerateTabs";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TIERS, isPaidTier } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

export const metadata = { title: "Generate a meme" };
export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await createServiceClient()
        .from("profiles")
        .select("subscription_tier, coin_balance")
        .eq("id", user.id)
        .single()
    : { data: null };

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const canRemoveWatermark = TIERS[tier].removesWatermark;
  const coinBalance = isPaidTier(tier) ? profile?.coin_balance ?? 0 : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold">Generate a meme</h1>
        <p className="mt-2 text-ink-300">
          Describe any situation — the more specific, the funnier. We&apos;ll suggest a style automatically, or you can pick one. Or upload your own image to watermark, share, and turn into a sticker.
        </p>
        <div className="mt-8">
          <GenerateTabs canRemoveWatermark={canRemoveWatermark} coinBalance={coinBalance} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
