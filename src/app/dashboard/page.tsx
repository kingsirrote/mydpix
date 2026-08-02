import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MemeGrid } from "@/components/MemeGrid";
import { SavedPromptsList } from "@/components/SavedPromptsList";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: recentMemes } = await supabase
    .from("memes")
    .select("id, title, image_url, thumbnail_url, aspect_ratio, view_count, like_count, download_count")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name")
    .eq("user_id", user.id)
    .limit(6);

  const { data: likedRows } = await supabase
    .from("likes")
    .select("memes(id, title, image_url, thumbnail_url, aspect_ratio, view_count, like_count, download_count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);
  const likedMemes = (likedRows ?? []).map((row: any) => row.memes).filter(Boolean);

  const { data: savedPrompts } = await supabase
    .from("saved_prompts")
    .select("id, prompt, style, aspect_ratio, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const isPremium = profile?.role === "premium" || profile?.role === "admin";
  const dailyLimit = isPremium ? 100 : 6;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Hey, {profile?.display_name ?? profile?.username}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge>{isPremium ? "Premium" : "Free plan"}</Badge>
              <span className="text-xs text-ink-500">
                {profile?.generation_count_today ?? 0}/{dailyLimit} generations today
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isPremium && (
              <Link href="/pricing"><Button variant="outline">Upgrade to Premium</Button></Link>
            )}
            <Link href="/generate"><Button>New meme</Button></Link>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Your recent generations</h2>
            <Link href="/dashboard/collections" className="text-sm text-signal hover:underline">
              Manage collections →
            </Link>
          </div>
          <MemeGrid memes={recentMemes ?? []} emptyLabel="You haven't generated any memes yet." />
        </section>

        {collections && collections.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-semibold">Your collections</h2>
            <div className="flex flex-wrap gap-3">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/collections/${c.id}`}
                  className="rounded-xl border border-base-700 bg-base-900 px-4 py-3 text-sm hover:border-signal"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold">Memes you&apos;ve liked</h2>
          <MemeGrid memes={likedMemes} emptyLabel="Like memes in the library to see them here." />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold">Saved prompts</h2>
          <SavedPromptsList initialPrompts={savedPrompts ?? []} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
