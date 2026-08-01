import { createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

export const metadata = { title: "Admin — Analytics" };

export default async function AdminAnalyticsPage() {
  const service = createServiceClient();

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: logs } = await service
    .from("generation_logs")
    .select("created_at, status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const dailyCounts: Record<string, { date: string; success: number; failed: number; moderated: number }> = {};
  for (const log of logs ?? []) {
    const day = new Date(log.created_at).toISOString().slice(0, 10);
    if (!dailyCounts[day]) dailyCounts[day] = { date: day, success: 0, failed: 0, moderated: 0 };
    if (log.status === "success") dailyCounts[day].success += 1;
    else if (log.status === "failed") dailyCounts[day].failed += 1;
    else if (log.status === "moderated") dailyCounts[day].moderated += 1;
  }
  const series = Object.values(dailyCounts);

  const { data: categoryBreakdown } = await service
    .from("memes")
    .select("category_id, categories(name)")
    .not("category_id", "is", null);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryBreakdown ?? []) {
    const name = (row as any).categories?.name ?? "Uncategorized";
    categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
  }
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  const { count: premiumUsers } = await service
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "premium");
  const { count: totalUsers } = await service.from("profiles").select("*", { count: "exact", head: true });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Analytics</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-ink-500">Premium conversion</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {totalUsers ? Math.round(((premiumUsers ?? 0) / totalUsers) * 100) : 0}%
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-500">Premium users</p>
          <p className="mt-1 font-display text-2xl font-bold">{premiumUsers ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-500">Generations (14d)</p>
          <p className="mt-1 font-display text-2xl font-bold">{logs?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-500">Categories tracked</p>
          <p className="mt-1 font-display text-2xl font-bold">{categoryData.length}</p>
        </Card>
      </div>

      <div className="mt-8">
        <AnalyticsCharts series={series} categoryData={categoryData} />
      </div>
    </div>
  );
}
