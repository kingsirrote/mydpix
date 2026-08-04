import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MemeGrid } from "@/components/MemeGrid";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";

export const metadata = { title: "Meme Library" };

interface LibraryPageProps {
  searchParams: { q?: string; category?: string; sort?: string };
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  let memes;
  if (searchParams.q) {
    const params = new URLSearchParams({ q: searchParams.q });
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search?${params}`, { cache: "no-store" });
    const data = await res.json();
    memes = data.results;
  } else {
    let query = supabase
      .from("memes")
      .select("id, title, image_url, thumbnail_url, aspect_ratio, media_type, view_count, like_count, download_count, is_featured")
      .eq("is_public", true)
      .eq("moderation_status", "approved");
    if (searchParams.category) query = query.eq("category_id", searchParams.category);
    query = query.order(searchParams.sort === "most_liked" ? "like_count" : "created_at", { ascending: false });
    const { data } = await query.limit(48);
    memes = data;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-3xl font-bold">Meme Library</h1>
          <SearchBar defaultValue={searchParams.q} />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/library"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!searchParams.category ? "border-signal text-signal" : "border-base-700 text-ink-300"}`}
          >
            All
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              href={`/library?category=${cat.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${searchParams.category === cat.id ? "border-signal text-signal" : "border-base-700 text-ink-300"}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <MemeGrid memes={memes ?? []} emptyLabel="Nothing matches yet — try a different search." />
      </main>
      <Footer />
    </div>
  );
}
