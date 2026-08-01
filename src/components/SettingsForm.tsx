"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function SettingsForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  const supabase = createClient();
  const isPremium = profile?.role === "premium" || profile?.role === "admin";

  async function handleSaveProfile() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", profile!.id);
    if (error) toast.error("Could not save changes.");
    else toast.success("Profile updated.");
    setSaving(false);
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      setNewPassword("");
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not open billing portal.");
      setPortalLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-ink-500">Email</label>
            <Input value={email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-500">Display name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Password</h2>
        <div className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button variant="secondary" onClick={handlePasswordChange}>
            Update password
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Subscription</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{isPremium ? "Premium" : "Free"}</Badge>
              <span className="text-xs text-ink-500">{profile?.subscription_status}</span>
            </div>
          </div>
          {isPremium ? (
            <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? "Opening…" : "Manage billing"}
            </Button>
          ) : (
            <a href="/pricing">
              <Button>Upgrade</Button>
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
