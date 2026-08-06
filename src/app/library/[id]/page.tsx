import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { DetailActions } from "@/components/DetailActions";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";

export default async function MemeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: meme } = await supabase.from("memes").select("*").eq("id", params.id).single();

  if (!meme) notFound();

  const { data: related } = await supabase
    .from("memes")
    .select("id, title, image_url, thumbnail_url, aspect_ratio, media_type, view_count, like_count, download_count")
    .eq("category_id", meme.category_id ?? "")
    .neq("id", meme.id)
    .limit(4);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-base-700 bg-base-900">
          <div className="relative aspect-square w-full">
            {meme.media_type === "video" ? (
              <>
                <video
                  src={meme.image_url}
                  className="h-full w-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/80">
                  mydpix.ai
                </span>
              </>
            ) : (
              <Image src={meme.image_url} alt={meme.title} fill className="object-contain" priority />
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold">{meme.title}</h1>
          {meme.prompt && <p className="mt-2 text-sm text-ink-500">&ldquo;{meme.prompt}&rdquo;</p>}

          <div className="mt-4 flex gap-4 text-sm text-ink-300">
            <span>{formatCount(meme.view_count)} views</span>
            <span>{formatCount(meme.like_count)} likes</span>
            <span>{formatCount(meme.download_count)} downloads</span>
          </div>

          {meme.prompt && (
            <Link
              href={`/generate?prompt=${encodeURIComponent(meme.prompt)}${meme.style ? `&style=${meme.style}` : ""}`}
              className="mt-4 block"
            >
              <Button className="w-full sm:w-auto">
                <Wand2 className="h-4 w-4" /> Use this meme →
              </Button>
            </Link>
          )}

          <div className="mt-6">
            <DetailActions
              memeId={meme.id}
              imageUrl={meme.image_url}
              title={meme.title}
              mediaType={meme.media_type}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
