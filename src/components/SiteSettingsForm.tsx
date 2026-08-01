"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Setting {
  key: string;
  value: unknown;
}

export function SiteSettingsForm({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, JSON.stringify(s.value)]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function handleSave(key: string) {
    setSavingKey(key);
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(values[key] ?? "");
    } catch {
      toast.error("Value must be valid JSON (e.g. numbers unquoted, strings in quotes).");
      setSavingKey(null);
      return;
    }
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: parsedValue }),
    });
    if (!res.ok) toast.error("Could not save.");
    else toast.success(`${key} updated.`);
    setSavingKey(null);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {settings.map((s) => (
        <Card key={s.key} className="p-4">
          <label className="mb-1 block text-xs text-ink-500">{s.key}</label>
          <div className="flex gap-2">
            <Input
              value={values[s.key] ?? ""}
              onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
            />
            <Button size="sm" onClick={() => handleSave(s.key)} disabled={savingKey === s.key}>
              Save
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
