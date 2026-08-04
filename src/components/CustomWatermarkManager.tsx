"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CustomWatermarkManager({ currentWatermarkUrl }: { currentWatermarkUrl: string | null }) {
  const [preview, setPreview] = useState(currentWatermarkUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileSelect(file: File | null) {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/watermark", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not upload watermark.");
    } else {
      setPreview(data.watermarkUrl);
      toast.success("Watermark updated — it'll show on everything you create from now on.");
      router.refresh();
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!confirm("Remove your custom watermark? New memes will use the default MyDpix badge instead.")) return;
    setRemoving(true);
    const res = await fetch("/api/watermark", { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove watermark.");
    } else {
      setPreview(null);
      toast.success("Custom watermark removed.");
      router.refresh();
    }
    setRemoving(false);
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">Custom watermark</h2>
      <p className="mt-1 text-sm text-ink-500">
        A Tier 3 perk — upload your own logo and it replaces the default MyDpix badge on every image you generate
        or upload. PNG or WebP, transparent background recommended, 2MB max.
      </p>

      <div className="mt-4 flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary storage URL, not worth whitelisting
          <img
            src={preview}
            alt="Your custom watermark"
            className="h-16 w-16 rounded-lg border border-base-700 bg-base-950 object-contain p-1"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-base-700 text-[10px] text-ink-500">
            None set
          </div>
        )}

        <div className="flex gap-2">
          <label>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : preview ? "Replace" : "Upload"}
            </Button>
          </label>
          {preview && (
            <Button variant="danger" onClick={handleRemove} disabled={removing}>
              <Trash2 className="h-4 w-4" /> {removing ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
