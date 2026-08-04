"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Download, Eye, Play } from "lucide-react";
import { formatCount } from "@/lib/utils";

export interface MemeCardData {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string | null;
  aspect_ratio: string;
  media_type?: "image" | "video";
  view_count: number;
  like_count: number;
  download_count: number;
  is_featured?: boolean;
}

const ASPECT_CLASS: Record<string, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

export function MemeCard({ meme }: { meme: MemeCardData }) {
  const isVideo = meme.media_type === "video";

  return (
    <Link
      href={`/library/${meme.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-base-700 bg-base-900 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className={`relative w-full overflow-hidden ${ASPECT_CLASS[meme.aspect_ratio] ?? "aspect-square"}`}>
        {isVideo ? (
          <video
            src={meme.image_url}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : (
          <Image
            src={meme.thumbnail_url ?? meme.image_url}
            alt={meme.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {isVideo && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Play className="h-2.5 w-2.5 fill-white" /> Video
          </span>
        )}
        {meme.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-signal px-2 py-0.5 text-[10px] font-semibold text-base-950">
            Featured
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatCount(meme.view_count)}</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatCount(meme.like_count)}</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {formatCount(meme.download_count)}</span>
        </div>
      </div>
    </Link>
  );
}
