"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Upload, Lock, X, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareButton, StickerButton } from "@/components/ShareButtons";

interface UploadedMeme {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  title: string;
}

export function UploadForm({
  canRemoveWatermark,
  coinBalance,
}: {
  canRemoveWatermark: boolean;
  coinBalance: number | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedMeme | null>(null);
  const [coins, setCoins] = useState(coinBalance);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selected: File | null) {
    setFile(selected);
    setUploaded(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  function clearFile() {
    handleFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Choose an image first.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());
    formData.append("removeWatermark", String(removeWatermark));

    try {
      const res = await fetch("/api/memes/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      setUploaded(data.meme);
      if (typeof data.coinsRemaining === "number") setCoins(data.coinsRemaining);
      toast.success("Uploaded! Find it in your dashboard too.");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-base-700 bg-base-900 p-4 sm:p-6">
        {coins !== null && (
          <div className="mb-4 flex items-center gap-1.5 text-sm text-signal">
            <Coins className="h-4 w-4" /> {coins} coin{coins === 1 ? "" : "s"} available
          </div>
        )}

        {!previewUrl ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-700 py-12 text-ink-500 hover:border-signal hover:text-signal">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click to choose an image (PNG, JPG, WebP — max 8MB)</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <div className="relative">
            <button
              onClick={clearFile}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-xl">
              <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Input
            placeholder="Give it a title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={removeWatermark}
              disabled={!canRemoveWatermark}
              onChange={(e) => setRemoveWatermark(e.target.checked)}
              className="h-4 w-4 rounded border-base-700 bg-base-900 accent-signal"
            />
            Remove watermark
            {!canRemoveWatermark && <Lock className="h-3 w-3 text-ink-500" />}
          </label>
        </div>

        <Button className="mt-5 w-full sm:w-auto" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Uploading…" : "Upload image"}
        </Button>

        <p className="mt-3 text-xs text-ink-500">
          Uploaded images are private to you until an admin approves them for the public library — you can still
          download, share, and use them right away.
        </p>
      </div>

      {uploaded && (
        <div className="overflow-hidden rounded-2xl border border-base-700">
          <div className="relative aspect-square w-full">
            <Image src={uploaded.image_url} alt={uploaded.title} fill className="object-cover" />
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 border-t border-base-700 bg-base-900 p-2">
            <ShareButton imageUrl={uploaded.image_url} title={uploaded.title} />
            <StickerButton memeId={uploaded.id} />
          </div>
        </div>
      )}
    </div>
  );
}
