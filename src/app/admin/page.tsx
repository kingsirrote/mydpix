import { createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const service = createServiceClient();

  const [{ count: userCount }, { count: memeCount }, { count: pendingCount }, { count: generationsToday }] =
    await Promise.all([
      service.from("profiles").select("*", { count: "exact", head: true }),
      service.from("memes").select("*", { count: "exact", head: true }),
      service.from("memes").select("*", { count: "exact", head: true }).eq("moderation_status", "pending"),
      service
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()),
    ]);

  const stats = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Total memes", value: memeCount ?? 0 },
    { label: "Pending moderation", value: pendingCount ?? 0 },
    { label: "Generations today", value: generationsToday ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-ink-500">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
