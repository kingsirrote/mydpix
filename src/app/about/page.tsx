import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-balance font-display text-4xl font-bold leading-tight sm:text-5xl">
          The internet happens.<br />
          <span className="text-signal">MyDpix makes the meme.</span>
        </h1>

        <div className="mt-10 space-y-6 text-ink-300">
          <p>
            Salary don finish. NEPA took light mid-movie. Your boss called at 6:58pm on a Friday. Every day gives
            you material — MyDpix just turns it into something you can actually send.
          </p>
          <p>
            We started with one idea: the AI meme tools out there were built for a generic, global internet.
            Ours isn&apos;t. MyDpix understands Naija humor, group-chat energy, football banter, and
            situationships — not as an afterthought, but as the whole point.
          </p>
          <p>
            Describe what happened. We generate options — relatable, savage, absolutely finished — you pick, you
            share. No design skills required, no starting from a blank canvas. Just the joke your group chat
            deserves, in seconds.
          </p>
          <p>
            MyDpix is built in Lagos, for the internet culture that never stops giving us content.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link href="/generate">
            <Button size="lg">Make a meme</Button>
          </Link>
          <Link href="/library">
            <Button size="lg" variant="outline">Explore the library</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
