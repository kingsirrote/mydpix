"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Role = "user" | "premium" | "admin";

const ROLE_STYLES: Record<Role, string> = {
  user: "text-ink-300",
  premium: "text-signal",
  admin: "text-mint",
};

export function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleChange(newRole: Role) {
    const previous = role;
    setRole(newRole);
    setSaving(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not update role.");
      setRole(previous);
    } else {
      toast.success(`Role updated to ${newRole}.`);
      router.refresh();
    }
    setSaving(false);
  }

  if (disabled) {
    return <span className={cn("text-xs font-medium", ROLE_STYLES[role])}>{role} (you)</span>;
  }

  return (
    <select
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as Role)}
      className={cn(
        "rounded-lg border border-base-700 bg-base-900 px-2 py-1 text-xs font-medium outline-none",
        ROLE_STYLES[role]
      )}
    >
      <option value="user">user</option>
      <option value="premium">premium (legacy, no billing effect)</option>
      <option value="admin">admin</option>
    </select>
  );
}
