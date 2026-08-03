"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  plan?: "tier1" | "tier2" | "tier3";
  highlight?: boolean;
}

export function PricingCard({ name, price, period, features, plan, highlight }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!plan) return;
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not start checkout.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 text-left",
        highlight ? "border-signal bg-signal/5" : "border-base-700 bg-base-900"
      )}
    >
      <p className="font-display text-lg font-semibold">{name}</p>
      <p className="mt-2">
        <span className="text-3xl font-bold">{price}</span>{" "}
        <span className="text-sm text-ink-500">{period}</span>
      </p>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {f}
          </li>
        ))}
      </ul>
      <Button
        className="mt-6 w-full"
        variant={plan ? "primary" : "secondary"}
        onClick={plan ? handleUpgrade : undefined}
        disabled={!plan || loading}
      >
        {plan ? (loading ? "Redirecting…" : "Upgrade") : "Current plan"}
      </Button>
    </div>
  );
}
