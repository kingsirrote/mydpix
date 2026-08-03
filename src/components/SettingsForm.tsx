"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuyCoinsButton } from "@/components/BuyCoinsButton";
import { TIERS, isPaidTier } from "@/lib/coins";
import type { Database } from "@/types/database";
import type { SubscriptionTier } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function SettingsForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const paid = isPaidTier(tier);
  const tierConfig = TIERS[tier];

  async function handleSaveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl || null })
      .eq("id", profile!.id);
    if (error) toast.error("Could not save changes.");
    else toast.success("Profile updated.");
    setSaving(false);
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const supabase = createClient();
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

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not delete account.");
      setDeleting(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Account deleted.");
    router.push("/");
    router.refresh();
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
          <div>
            <label className="mb-1 block text-xs text-ink-500">Avatar URL</label>
            <div className="flex items-center gap-3">
              {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided URL, can't whitelist every domain
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-10 w-10 shrink-0 rounded-full border border-base-700 object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Subscription</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{tierConfig.label}</Badge>
              <span className="text-xs text-ink-500">
                {paid ? `${profile?.coin_balance ?? 0} coins available` : profile?.subscription_status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {paid && tierConfig.canBuyTopUp && <BuyCoinsButton />}
            {paid ? (
              <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage billing"}
              </Button>
            ) : (
              <a href="/pricing">
                <Button>Upgrade</Button>
              </a>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-red-900/50 p-6">
        <h2 className="font-display text-lg font-semibold text-red-400">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-500">
          Permanently deletes your account, memes, collections, and subscription. This can&apos;t be undone.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder='Type "DELETE" to confirm'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <Button
            variant="danger"
            disabled={deleteConfirmText !== "DELETE" || deleting}
            onClick={handleDeleteAccount}
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
