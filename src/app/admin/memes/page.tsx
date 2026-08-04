import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { ModerationActions } from "@/components/ModerationActions";

export const metadata = { title: "Admin — Memes" };

export default async function AdminMemesPage() {
  const service = createServiceClient();
  const { data: memes } = await service
    .from("memes")
    .select("id, title, thumbnail_url, image_url, media_type, moderation_status, is_featured, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<
      Array<{
        id: string;
        title: string;
        thumbnail_url: string | null;
        image_url: string;
        media_type: "image" | "video";
        moderation_status: string;
        is_featured: boolean;
        owner_id: string | null;
        created_at: string;
      }>
    >();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Memes moderation</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(memes ?? []).map((meme) => (
          <div key={meme.id} className="overflow-hidden rounded-2xl border border-base-700 bg-base-900">
            <div className="relative aspect-square w-full">
              {meme.media_type === "video" ? (
                <video src={meme.image_url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <Image src={meme.thumbnail_url ?? meme.image_url} alt={meme.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs text-ink-300">{meme.title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-500">
                {meme.moderation_status} {meme.media_type === "video" && "· video"}
              </p>
              <ModerationActions memeId={meme.id} isFeatured={meme.is_featured} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
