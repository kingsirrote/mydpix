"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Share2, Sticker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareImage } from "@/lib/share";

export function ShareButton({
  imageUrl,
  title,
  size = "sm",
}: {
  imageUrl: string;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    const result = await shareImage(imageUrl, title);
    if (result === "copied") toast.success("Link copied — paste it anywhere to share.");
    if (result === "unsupported") toast.error("Sharing isn't supported in this browser.");
    setSharing(false);
  }

  return (
    <Button size={size} variant="secondary" onClick={handleShare} disabled={sharing}>
      <Share2 className="h-3.5 w-3.5" /> {sharing ? "…" : "Share"}
    </Button>
  );
}

export function StickerButton({ memeId, size = "sm" }: { memeId: string; size?: "sm" | "md" | "lg" }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch("/api/sticker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memeId }),
    });
    if (!res.ok) {
      toast.error("Could not create sticker.");
      setDownloading(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mydpix-sticker-${memeId.slice(0, 8)}.webp`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sticker downloaded — add it via any sticker-pack app for WhatsApp/Telegram.");
    setDownloading(false);
  }

  return (
    <Button size={size} variant="secondary" onClick={handleDownload} disabled={downloading}>
      <Sticker className="h-3.5 w-3.5" /> {downloading ? "…" : "Sticker"}
    </Button>
  );
}
