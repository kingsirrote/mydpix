import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MemeGrid } from "@/components/MemeGrid";

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/dashboard/collections/${params.id}`);

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!collection) notFound();

  const { data: items } = await supabase
    .from("collection_memes")
    .select("memes(id, title, image_url, thumbnail_url, aspect_ratio, view_count, like_count, download_count)")
    .eq("collection_id", params.id);

  const memes = (items ?? []).map((row: any) => row.memes).filter(Boolean);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold">{collection.name}</h1>
        {collection.description && <p className="mt-2 text-ink-300">{collection.description}</p>}
        <div className="mt-8">
          <MemeGrid memes={memes} emptyLabel="This collection is empty — add memes from the library." />
        </div>
      </main>
      <Footer />
    </div>
  );
}
