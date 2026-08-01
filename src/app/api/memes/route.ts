import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured");
  const sort = url.searchParams.get("sort") ?? "newest";
  const page = Number(url.searchParams.get("page") ?? "1");
  const perPage = Math.min(Number(url.searchParams.get("perPage") ?? "24"), 48);

  const supabase = createClient();
  let query = supabase
    .from("memes")
    .select(
      "id, title, image_url, thumbnail_url, aspect_ratio, style, view_count, like_count, download_count, is_featured, created_at, category_id",
      { count: "exact" }
    )
    .eq("is_public", true)
    .eq("moderation_status", "approved");

  if (category) query = query.eq("category_id", category);
  if (featured === "true") query = query.eq("is_featured", true);

  if (sort === "trending") query = query.order("trending_score", { ascending: false });
  else if (sort === "most_liked") query = query.order("like_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * perPage;
  const { data, error, count } = await query.range(from, from + perPage - 1);

  if (error) {
    return NextResponse.json({ error: "Could not load memes." }, { status: 500 });
  }

  return NextResponse.json({ results: data, total: count ?? 0, page, perPage });
}
