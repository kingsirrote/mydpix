"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Github, Chrome, Apple, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OAuthProvider = "google" | "apple" | "twitter" | "github";

const OAUTH_PROVIDERS: { provider: OAuthProvider; label: string; icon: typeof Github }[] = [
  { provider: "google", label: "Continue with Google", icon: Chrome },
  { provider: "apple", label: "Continue with Apple", icon: Apple },
  { provider: "twitter", label: "Continue with X", icon: Twitter },
  { provider: "github", label: "Continue with GitHub", icon: Github },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/api/auth/callback?redirectTo=${redirectTo}` },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    }
    // On success, the browser navigates away to the provider — no need to reset loading state.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/api/auth/callback?redirectTo=${redirectTo}` },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your inbox to confirm your email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        router.push(redirectTo);
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-6">
      <h1 className="text-center font-display text-xl font-bold">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>

      <div className="mt-6 space-y-2">
        {OAUTH_PROVIDERS.map(({ provider, label, icon: Icon }) => (
          <Button
            key={provider}
            variant="secondary"
            className="w-full"
            onClick={() => handleOAuth(provider)}
            disabled={oauthLoading !== null}
          >
            <Icon className="h-4 w-4" /> {oauthLoading === provider ? "Redirecting…" : label}
          </Button>
        ))}
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
        <div className="h-px flex-1 bg-base-700" /> or <div className="h-px flex-1 bg-base-700" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      {mode === "login" ? (
        <p className="mt-4 text-center text-xs text-ink-500">
          <a href="/forgot-password" className="hover:text-signal">Forgot password?</a> · No account?{" "}
          <a href="/signup" className="text-signal hover:underline">Sign up</a>
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-ink-500">
          Already have an account? <a href="/login" className="text-signal hover:underline">Log in</a>
        </p>
      )}
    </div>
  );
}
