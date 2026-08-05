import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingCard } from "@/components/PricingCard";
import { TIERS } from "@/lib/coins";

export const metadata = { title: "Pricing" };

function formatNaira(amount: number) {
  return amount === 0 ? "₦0" : `₦${amount.toLocaleString("en-NG")}`;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold">Simple, coin-based pricing</h1>
        <p className="mt-3 text-ink-300">
          Free gives you a taste. Paid plans run on coins that refresh every month — spend them on whatever you
          generate, no daily limits.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <PricingCard
            name={TIERS.free.label}
            price={formatNaira(TIERS.free.priceNaira)}
            period="forever"
            features={[
              "3 free generations / day",
              "Image and video uploads (same daily limit)",
              "Default MyDpix watermark on downloads",
              "Full library browsing and search",
              "Share directly to any app",
              "Sticker-format export (images)",
            ]}
          />
          <PricingCard
            name={TIERS.tier1.label}
            price={formatNaira(TIERS.tier1.priceNaira)}
            period="/ month"
            plan="tier1"
            features={[
              `${TIERS.tier1.monthlyCoins} coins / month, refreshed monthly`,
              "1 coin per square image, 2 coins for portrait/widescreen",
              "1 coin per image or video upload",
              "Watermark-free image downloads",
              "Buy extra coin top-ups anytime",
              "Full library browsing and search",
              "Share directly to any app",
              "Sticker-format export (images)",
            ]}
          />
          <PricingCard
            name={TIERS.tier2.label}
            price={formatNaira(TIERS.tier2.priceNaira)}
            period="/ month"
            plan="tier2"
            highlight
            features={[
              `${TIERS.tier2.monthlyCoins} coins / month, refreshed monthly`,
              "1 coin per square image, 2 coins for portrait/widescreen",
              "1 coin per image or video upload",
              "Watermark-free image downloads",
              "Priority generation queue",
              "Buy extra coin top-ups anytime",
              "Full library browsing and search",
              "Share directly to any app",
              "Sticker-format export (images)",
            ]}
          />
          <PricingCard
            name={TIERS.tier3.label}
            price={formatNaira(TIERS.tier3.priceNaira)}
            period="/ month"
            plan="tier3"
            features={[
              `${TIERS.tier3.monthlyCoins} coins / month, refreshed monthly`,
              "1 coin per square image, 2 coins for portrait/widescreen",
              "1 coin per image or video upload",
              "Watermark-free image downloads",
              "Priority generation queue",
              "Upload your own custom watermark — replaces the MyDpix badge on everything you create",
              "Buy extra coin top-ups anytime",
              "Full library browsing and search",
              "Share directly to any app",
              "Sticker-format export (images)",
            ]}
          />
        </div>

        <p className="mt-8 text-sm text-ink-500">
          Coins refresh to your plan&apos;s monthly amount on your billing date — unused coins don&apos;t roll over. Run out
          early? Buy a top-up pack from your dashboard.
        </p>
      </main>
      <Footer />
    </div>
  );
}
