"use client";

import { Suspense, useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import { GeneratorForm } from "@/components/GeneratorForm";
import { UploadForm } from "@/components/UploadForm";
import { cn } from "@/lib/utils";

export function GenerateTabs({ isPremium }: { isPremium: boolean }) {
  const [tab, setTab] = useState<"generate" | "upload">("generate");

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-base-700 bg-base-900 p-1">
        <button
          onClick={() => setTab("generate")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            tab === "generate" ? "bg-signal text-base-950" : "text-ink-300 hover:text-ink-100"
          )}
        >
          <Sparkles className="h-4 w-4" /> AI Generate
        </button>
        <button
          onClick={() => setTab("upload")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            tab === "upload" ? "bg-signal text-base-950" : "text-ink-300 hover:text-ink-100"
          )}
        >
          <Upload className="h-4 w-4" /> Upload Image
        </button>
      </div>

      {tab === "generate" ? (
        <Suspense fallback={null}>
          <GeneratorForm isPremium={isPremium} />
        </Suspense>
      ) : (
        <UploadForm isPremium={isPremium} />
      )}
    </div>
  );
}
