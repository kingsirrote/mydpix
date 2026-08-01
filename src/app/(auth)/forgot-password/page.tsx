"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-6">
      <h1 className="text-center font-display text-xl font-bold">Reset your password</h1>
      {sent ? (
        <p className="mt-4 text-center text-sm text-ink-300">
          If an account exists for {email}, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
    </div>
  );
}
