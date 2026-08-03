"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuyCoinsButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/paystack/topup", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not start checkout.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <Coins className="h-4 w-4" /> {loading ? "Redirecting…" : "Buy coins"}
    </Button>
  );
}
