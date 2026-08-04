import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  sort: z.enum(["relevance", "trending", "newest", "most_liked"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit("search", ip);
  if (!success) {
    return NextResponse.json({ error: "Too many searches, slow down a little." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search query." }, { status: 400 });
  }

  const { q, category, sort, page, perPage } = parsed.data;
  const supabase = createClient();

  // Natural-language query -> tsquery, tolerant of casual phrasing (websearch_to_tsquery
  // handles quotes, "or", and stray punctuation the way a search engine would).
  let query = supabase
    .from("memes")
    .select("id, title, prompt, image_url, thumbnail_url, aspect_ratio, media_type, style, view_count, like_count, download_count, is_featured, created_at, category_id", {
      count: "exact",
    })
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .textSearch("search_vector", q, { type: "websearch", config: "english" });

  if (category) {
    query = query.eq("category_id", category);
  }

  switch (sort) {
    case "trending":
      query = query.order("trending_score", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "most_liked":
      query = query.order("like_count", { ascending: false });
      break;
    default:
      // relevance ordering is implicit in textSearch matching; break ties with trending
      query = query.order("trending_score", { ascending: false });
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Search failed", error);
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 500 });
  }

  // Fallback: if the strict full-text search returns nothing (common for very
  // short or slangy queries), retry with a loose trigram similarity match on title.
  if ((data?.length ?? 0) === 0) {
    const { data: fuzzy } = await supabase
      .from("memes")
      .select("id, title, prompt, image_url, thumbnail_url, aspect_ratio, media_type, style, view_count, like_count, download_count, is_featured, created_at, category_id")
      .eq("is_public", true)
      .eq("moderation_status", "approved")
      .ilike("title", `%${q}%`)
      .order("trending_score", { ascending: false })
      .range(from, to);

    return NextResponse.json({ results: fuzzy ?? [], total: fuzzy?.length ?? 0, page, perPage, fuzzy: true });
  }

  return NextResponse.json({ results: data, total: count ?? data?.length ?? 0, page, perPage, fuzzy: false });
}
