import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingCard } from "@/components/PricingCard";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold">Simple pricing</h1>
        <p className="mt-3 text-ink-300">Generate more, remove the watermark, jump the queue.</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <PricingCard
            name="Free"
            price="₦0"
            period="forever"
            features={["6 meme generations / day", "Watermarked downloads", "Standard queue", "Full library access"]}
          />
          <PricingCard
            name="Premium"
            price="₦4,500"
            period="/ month"
            plan="premium_monthly"
            highlight
            features={["100 generations / day", "Watermark-free downloads", "Priority generation queue", "Early access to new styles"]}
          />
          <PricingCard
            name="Premium (Yearly)"
            price="₦42,000"
            period="/ year"
            plan="premium_yearly"
            features={["Everything in Premium", "2 months free", "Priority support"]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
