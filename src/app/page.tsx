import Link from "next/link";
import { Sparkles, Search, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroGenerateBox } from "@/components/HeroGenerateBox";
import { createClient } from "@/lib/supabase/server";
import { MemeGrid } from "@/components/MemeGrid";

export default async function HomePage() {
  const supabase = createClient();
  const { data: featured } = await supabase
    .from("memes")
    .select("id, title, image_url, thumbnail_url, aspect_ratio, media_type, view_count, like_count, download_count, is_featured")
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .order("trending_score", { ascending: false })
    .limit(8);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-base-700 bg-base-900 px-3 py-1 text-xs text-ink-300">
            <Sparkles className="h-3.5 w-3.5 text-signal" /> Now with instant Naija-flavored humor
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            Describe the situation.<br />
            <span className="text-signal">We&apos;ll meme it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-ink-300">
            MyDpix AI turns any life situation into a shareable meme in seconds — trained on internet humor,
            reaction culture, and the jokes your group chat actually sends.
          </p>

          <HeroGenerateBox />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Trending right now</h2>
          <Link href="/library" className="text-sm text-signal hover:underline">See all →</Link>
        </div>
        {featured && featured.length > 0 ? (
          <MemeGrid memes={featured} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-700 py-16 text-center">
            <p className="font-display text-lg font-semibold">The timeline&apos;s empty — for now.</p>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Be the first to make something. Every meme that gets liked and shared earns its spot up here.
            </p>
            <Link href="/generate" className="mt-4 text-sm text-signal hover:underline">
              Make the first one →
            </Link>
          </div>
        )}
      </section>

      <section className="border-t border-base-800 bg-base-900/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Feature
            icon={<Sparkles className="h-5 w-5 text-signal" />}
            title="Understands the joke"
            description="Football banter, office fatigue, situationships, Naija internet culture — MyDpix gets the reference before you finish typing."
          />
          <Feature
            icon={<Search className="h-5 w-5 text-signal" />}
            title="Search like a human"
            description='Type "salary don finish" instead of exact tags. Our semantic search finds the meme that matches the vibe.'
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5 text-signal" />}
            title="Built to be shared"
            description="Every download is optimized for WhatsApp, Instagram, and X — high resolution, correctly cropped, ready to post."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-base-800 bg-base-950 p-6">
      <div className="mb-3 inline-flex rounded-lg bg-signal/10 p-2">{icon}</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ink-300">{description}</p>
    </div>
  );
}
