// Hand-authored to match supabase/migrations/0001_init.sql.
// Regenerate with `npm run db:types` once the project is linked to a live
// Supabase project — this file is a safe, accurate starting point either way.

export type UserRole = "user" | "premium" | "admin";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "none";
export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3";
export type MemeSource = "ai_generated" | "uploaded" | "imported";
export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          subscription_status: SubscriptionStatus;
          subscription_tier: SubscriptionTier;
          coin_balance: number;
          coin_refresh_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          paystack_customer_code: string | null;
          paystack_subscription_code: string | null;
          paystack_email_token: string | null;
          generation_count_today: number;
          generation_count_reset_at: string;
          monthly_generation_count: number;
          monthly_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; username: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      tags: {
        Row: { id: string; slug: string; name: string; usage_count: number };
        Insert: Partial<Database["public"]["Tables"]["tags"]["Row"]> & { slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["tags"]["Row"]>;
      };
      memes: {
        Row: {
          id: string;
          owner_id: string | null;
          title: string;
          prompt: string | null;
          optimized_prompt: string | null;
          style: string | null;
          aspect_ratio: string;
          source: MemeSource;
          image_url: string;
          thumbnail_url: string | null;
          watermarked: boolean;
          width: number | null;
          height: number | null;
          category_id: string | null;
          moderation_status: ModerationStatus;
          moderation_notes: string | null;
          is_featured: boolean;
          is_public: boolean;
          view_count: number;
          download_count: number;
          like_count: number;
          trending_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["memes"]["Row"]> & { title: string; image_url: string };
        Update: Partial<Database["public"]["Tables"]["memes"]["Row"]>;
      };
      likes: {
        Row: { user_id: string; meme_id: string; created_at: string };
        Insert: { user_id: string; meme_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["likes"]["Row"]>;
      };
      downloads: {
        Row: { id: string; user_id: string | null; meme_id: string; format: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["downloads"]["Row"]> & { meme_id: string };
        Update: Partial<Database["public"]["Tables"]["downloads"]["Row"]>;
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          cover_meme_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & { user_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
      };
      collection_memes: {
        Row: { collection_id: string; meme_id: string; added_at: string };
        Insert: { collection_id: string; meme_id: string; added_at?: string };
        Update: Partial<Database["public"]["Tables"]["collection_memes"]["Row"]>;
      };
      saved_prompts: {
        Row: {
          id: string;
          user_id: string;
          prompt: string;
          style: string | null;
          aspect_ratio: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["saved_prompts"]["Row"]> & { user_id: string; prompt: string };
        Update: Partial<Database["public"]["Tables"]["saved_prompts"]["Row"]>;
      };
      generation_logs: {
        Row: {
          id: string;
          user_id: string | null;
          prompt: string;
          optimized_prompt: string | null;
          style: string | null;
          aspect_ratio: string | null;
          variations: number;
          status: string;
          error_message: string | null;
          latency_ms: number | null;
          provider: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["generation_logs"]["Row"]> & { prompt: string };
        Update: Partial<Database["public"]["Tables"]["generation_logs"]["Row"]>;
      };
      site_settings: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          meme_id: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["coin_transactions"]["Row"]> & {
          user_id: string;
          amount: number;
          reason: string;
          balance_after: number;
        };
        Update: Partial<Database["public"]["Tables"]["coin_transactions"]["Row"]>;
      };
    };
  };
}
