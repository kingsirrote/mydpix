// Deploy with: supabase functions deploy refresh-trending
// Schedule with: supabase functions schedule create refresh-trending --cron "*/15 * * * *"
// (or configure a cron trigger in the Supabase dashboard)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc("refresh_trending_scores");

  if (error) {
    console.error("Failed to refresh trending scores", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, refreshedAt: new Date().toISOString() }), { status: 200 });
});
