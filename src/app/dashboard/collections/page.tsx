import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CollectionsManager } from "@/components/CollectionsManager";

export const metadata = { title: "Your collections" };
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard/collections");

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, description, is_public, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold">Your collections</h1>
        <p className="mt-2 text-ink-300">Group memes together — great for a running &ldquo;office chat&rdquo; folder or a campaign moodboard.</p>
        <div className="mt-8">
          <CollectionsManager initialCollections={collections ?? []} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
