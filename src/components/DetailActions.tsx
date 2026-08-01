"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DetailActions({ memeId }: { memeId: string }) {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    setBusy(true);
    const res = await fetch(`/api/memes/${memeId}`, { method: "POST" });
    if (res.status === 401) {
      toast.error("Sign in to like memes.");
      setBusy(false);
      return;
    }
    const data = await res.json();
    setLiked(data.liked);
    setBusy(false);
  }

  async function download(format: "png" | "jpg") {
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memeId, format }),
    });
    if (!res.ok) {
      toast.error("Download failed.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mydpix-${memeId.slice(0, 8)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant={liked ? "primary" : "outline"} onClick={toggleLike} disabled={busy}>
        <Heart className="h-4 w-4" /> {liked ? "Liked" : "Like"}
      </Button>
      <Button variant="secondary" onClick={() => download("png")}>
        <Download className="h-4 w-4" /> PNG
      </Button>
      <Button variant="secondary" onClick={() => download("jpg")}>
        <Download className="h-4 w-4" /> JPG
      </Button>
    </div>
  );
}
