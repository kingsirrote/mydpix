"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Give the category a name.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Could not create category.");
    else {
      toast.success("Category created.");
      setName("");
      setDescription("");
      router.refresh();
    }
    setCreating(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description ?? "");
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDescription || null }),
    });
    if (!res.ok) toast.error("Could not save changes.");
    else {
      toast.success("Category updated.");
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Memes in it will become uncategorized.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Could not delete category.");
    else {
      toast.success("Category deleted.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-2 p-4 sm:flex-row">
        <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={handleCreate} disabled={creating} className="shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <Card key={c.id} className="p-4">
            {editingId === c.id ? (
              <div className="space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(c.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-ink-500">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="rounded-lg p-1.5 text-ink-500 hover:bg-base-800">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
