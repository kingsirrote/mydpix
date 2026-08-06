"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const QUICK_TRIES = ["Salary don finish", "NEPA took light", "My boss called", "Relationship wahala"];

export function HeroGenerateBox() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim().length < 3) return;
    router.push(`/generate?prompt=${encodeURIComponent(prompt.trim())}`);
  }

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-base-700 bg-base-900 p-3 text-left shadow-2xl shadow-black/20"
      >
        <label className="px-2 text-xs font-medium text-ink-500">Describe what happened 👀</label>
        <Textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="My salary disappeared the same day rent was due"
          className="mt-1 border-none bg-transparent px-2 text-base focus:border-none"
          maxLength={500}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={prompt.trim().length < 3}>
            Generate meme <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-500">
        <span className="text-signal">🔥 Try:</span>
        {QUICK_TRIES.map((q, i) => (
          <span key={q} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrompt(q)}
              className="rounded-full border border-base-800 bg-base-900/60 px-3 py-1 hover:border-signal hover:text-signal"
            >
              {q}
            </button>
            {i < QUICK_TRIES.length - 1 && <span className="text-ink-700">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
