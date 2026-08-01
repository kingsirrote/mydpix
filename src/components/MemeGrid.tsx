import { MemeCard, type MemeCardData } from "@/components/MemeCard";

export function MemeGrid({ memes, emptyLabel = "No memes here yet." }: { memes: MemeCardData[]; emptyLabel?: string }) {
  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-700 py-20 text-center">
        <p className="text-ink-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
}
