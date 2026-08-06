import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { isPaidTier } from "@/lib/coins";
import type { SubscriptionTier } from "@/types/database";

export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    display_name: string | null;
    username: string;
    role: string;
    subscription_tier: SubscriptionTier;
    coin_balance: number;
  } | null = null;
  if (user) {
    const service = createServiceClient();
    const { data } = await service
      .from("profiles")
      .select("display_name, username, role, subscription_tier, coin_balance")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-base-800/80 bg-base-950/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          my<span className="text-signal">dpix</span>
          <span className="ml-1 rounded-md bg-base-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-ink-300 align-middle">AI</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm text-ink-300 md:flex">
          <Link href="/generate" className="hover:text-ink-100">Create</Link>
          <Link href="/library" className="hover:text-ink-100">Explore</Link>
          <Link href="/pricing" className="hover:text-ink-100">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <MobileNav />
          {user ? (
            <UserMenu
              displayName={profile?.display_name ?? profile?.username ?? "Account"}
              isAdmin={profile?.role === "admin"}
              coinBalance={profile && isPaidTier(profile.subscription_tier) ? profile.coin_balance : null}
            />
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Create meme</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
