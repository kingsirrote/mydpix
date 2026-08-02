"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, X, Star, Trash2 } from "lucide-react";

export function ModerationActions({ memeId, isFeatured }: { memeId: string; isFeatured: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function updateStatus(status: "approved" | "rejected") {
    setBusy(true);
    const res = await fetch(`/api/admin/memes/${memeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderation_status: status }),
    });
    if (!res.ok) toast.error("Update failed.");
    else {
      toast.success(status === "approved" ? "Approved" : "Rejected");
      router.refresh();
    }
    setBusy(false);
  }

  async function toggleFeatured() {
    setBusy(true);
    const res = await fetch(`/api/admin/memes/${memeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !isFeatured }),
    });
    if (!res.ok) toast.error("Update failed.");
    else router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this meme? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/memes/${memeId}`, { method: "DELETE" });
    if (!res.ok) toast.error("Delete failed.");
    else {
      toast.success("Meme deleted.");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="mt-2 flex gap-1.5">
      <button
        disabled={busy}
        onClick={() => updateStatus("approved")}
        className="flex-1 rounded-lg bg-mint/10 p-1.5 text-mint hover:bg-mint/20"
        title="Approve"
      >
        <Check className="mx-auto h-3.5 w-3.5" />
      </button>
      <button
        disabled={busy}
        onClick={() => updateStatus("rejected")}
        className="flex-1 rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
        title="Reject"
      >
        <X className="mx-auto h-3.5 w-3.5" />
      </button>
      <button
        disabled={busy}
        onClick={toggleFeatured}
        className={`flex-1 rounded-lg p-1.5 ${isFeatured ? "bg-signal/20 text-signal" : "bg-base-800 text-ink-500"} hover:bg-signal/20`}
        title="Feature"
      >
        <Star className="mx-auto h-3.5 w-3.5" />
      </button>
      <button
        disabled={busy}
        onClick={handleDelete}
        className="flex-1 rounded-lg bg-base-800 p-1.5 text-ink-500 hover:bg-red-500/20 hover:text-red-400"
        title="Delete"
      >
        <Trash2 className="mx-auto h-3.5 w-3.5" />
      </button>
    </div>
  );
}
