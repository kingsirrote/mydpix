"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Sparkles, Download, RefreshCw, Lock, BookmarkPlus, Coins, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareButton, StickerButton } from "@/components/ShareButtons";
import { cn } from "@/lib/utils";

const STYLES = [
  { value: "classic-macro", label: "Classic Macro" },
  { value: "reaction-face", label: "Reaction Face" },
  { value: "drake-format", label: "Drake Format" },
  { value: "distracted-format", label: "Distracted Format" },
  { value: "naija-skit", label: "Naija Skit" },
  { value: "office-meme", label: "Office Humor" },
  { value: "wholesome-poster", label: "Wholesome Poster" },
] as const;

const RATIOS = [
  { value: "1:1", label: "Square", coins: 1 },
  { value: "4:5", label: "Portrait", coins: 2 },
  { value: "16:9", label: "Widescreen", coins: 2 },
  { value: "9:16", label: "Story", coins: 2 },
] as const;

interface GeneratedMeme {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
}

export function GeneratorForm({
  canRemoveWatermark,
  coinBalance,
}: {
  canRemoveWatermark: boolean;
  coinBalance: number | null;
}) {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState(searchParams.get("prompt") ?? "");
  const [style, setStyle] = useState<string | null>(searchParams.get("style"));
  const [aspectRatio, setAspectRatio] = useState<(typeof RATIOS)[number]["value"]>("1:1");
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedMeme[]>([]);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [coins, setCoins] = useState(coinBalance);

  // Re-sync if the search params change after mount (e.g. clicking another
  // "Use this prompt" link while already on /generate).
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) setPrompt(urlPrompt);
    const urlStyle = searchParams.get("style");
    if (urlStyle) setStyle(urlStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSavePrompt() {
    setSavingPrompt(true);
    const res = await fetch("/api/saved-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, style: style ?? undefined, aspectRatio }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not save prompt.");
    } else {
      toast.success("Prompt saved — find it on your dashboard.");
    }
    setSavingPrompt(false);
  }

  async function handleGenerate() {
    if (prompt.trim().length < 3) {
      toast.error("Describe the situation in a bit more detail.");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: style ?? undefined,
          aspectRatio,
          variations: 4,
          removeWatermark,
          topText: topText.trim() || undefined,
          bottomText: bottomText.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Something went wrong generating your meme.");
        return;
      }
      setResults(data.memes);
      if (typeof data.coinsRemaining === "number") setCoins(data.coinsRemaining);
      toast.success("Your memes are ready!");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(memeId: string, format: "png" | "jpg") {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memeId, format }),
    });
    if (!response.ok) {
      toast.error("Download failed.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mydpix-${memeId.slice(0, 8)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-base-700 bg-base-900 p-4 sm:p-6">
        {coins !== null && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-signal" />
            <span className="text-ink-300">You&apos;ve got <span className="font-semibold text-signal">{coins}</span> to play with</span>
          </div>
        )}

        <Textarea
          rows={3}
          placeholder='Describe the situation… e.g. "My salary disappeared the same day rent was due"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(style === s.value ? null : s.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                style === s.value
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-base-700 text-ink-300 hover:border-base-500"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium",
                  aspectRatio === r.value ? "border-signal text-signal" : "border-base-700 text-ink-300"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

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

        {coinBalance !== null && aspectRatio !== "1:1" && (
          <p className="mt-2 text-xs text-ink-500">Portrait and widescreen use a little more than square.</p>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCaption((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-300 hover:text-signal"
          >
            <Type className="h-3.5 w-3.5" /> {showCaption ? "Hide caption text" : "Add caption text (optional)"}
          </button>
          {showCaption && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Input placeholder="Top text" value={topText} onChange={(e) => setTopText(e.target.value)} maxLength={100} />
              <Input
                placeholder="Bottom text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                maxLength={100}
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate meme"}
          </Button>
          <Button variant="outline" onClick={handleSavePrompt} disabled={savingPrompt || prompt.trim().length < 3}>
            <BookmarkPlus className="h-4 w-4" /> {savingPrompt ? "Saving…" : "Save prompt"}
          </Button>
        </div>
      </div>

      {(loading || results.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-base-800" />
            ))}
          {results.map((meme) => (
            <div key={meme.id} className="overflow-hidden rounded-2xl border border-base-700">
              <div className="relative aspect-square w-full">
                <Image src={meme.image_url} alt="Generated meme" fill className="object-cover" />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 border-t border-base-700 bg-base-900 p-2">
                <Button size="sm" variant="secondary" onClick={() => handleDownload(meme.id, "png")}>
                  <Download className="h-3 w-3" /> PNG
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleDownload(meme.id, "jpg")}>
                  <Download className="h-3 w-3" /> JPG
                </Button>
                <ShareButton imageUrl={meme.image_url} title="Check out this meme from MyDpix AI" />
                <StickerButton memeId={meme.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
