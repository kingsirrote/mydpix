"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Trash2, Wand2 } from "lucide-react";

interface SavedPrompt {
  id: string;
  prompt: string;
  style: string | null;
  aspect_ratio: string | null;
  created_at: string;
}

export function SavedPromptsList({ initialPrompts }: { initialPrompts: SavedPrompt[] }) {
  const [prompts, setPrompts] = useState(initialPrompts);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/saved-prompts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete prompt.");
      return;
    }
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }

  if (prompts.length === 0) {
    return <p className="text-sm text-ink-500">No saved prompts yet — save one from the generator.</p>;
  }

  return (
    <div className="space-y-2">
      {prompts.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-base-700 bg-base-900 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm">{p.prompt}</p>
            {p.style && <p className="mt-0.5 text-xs text-ink-500">{p.style}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <Link
              href={`/generate?prompt=${encodeURIComponent(p.prompt)}${p.style ? `&style=${p.style}` : ""}`}
              className="rounded-lg p-2 text-ink-500 hover:bg-base-800 hover:text-signal"
              title="Use this prompt"
            >
              <Wand2 className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(p.id)}
              className="rounded-lg p-2 text-ink-500 hover:bg-red-500/20 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
