"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Lock, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export function CollectionsManager({ initialCollections }: { initialCollections: CollectionItem[] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Give your collection a name.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not create collection.");
    } else {
      setCollections([data.collection, ...collections]);
      setName("");
      toast.success("Collection created.");
    }
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input placeholder="New collection name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={handleCreate} disabled={creating}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/collections/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-base-700 bg-base-900 px-4 py-3 hover:border-signal"
          >
            <span className="font-medium">{c.name}</span>
            {c.is_public ? <Globe className="h-4 w-4 text-ink-500" /> : <Lock className="h-4 w-4 text-ink-500" />}
          </Link>
        ))}
        {collections.length === 0 && (
          <p className="text-sm text-ink-500">No collections yet — create your first one above.</p>
        )}
      </div>
    </div>
  );
}
