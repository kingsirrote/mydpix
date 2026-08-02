import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";

export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { display_name: string | null; username: string; role: string } | null = null;
  if (user) {
    const service = createServiceClient();
    const { data } = await service
      .from("profiles")
      .select("display_name, username, role")
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
          <Link href="/generate" className="hover:text-ink-100">Generate</Link>
          <Link href="/library" className="hover:text-ink-100">Library</Link>
          <Link href="/pricing" className="hover:text-ink-100">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu
              displayName={profile?.display_name ?? profile?.username ?? "Account"}
              isAdmin={profile?.role === "admin"}
            />
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up free</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
