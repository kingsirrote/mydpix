import { createServiceClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { SiteSettingsForm } from "@/components/SiteSettingsForm";

export const metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  const service = createServiceClient();
  const { data: settings } = await service.from("site_settings").select("*");
  const { data: categories } = await service.from("categories").select("*").order("sort_order");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Site settings</h1>
        <p className="mt-1 text-sm text-ink-500">Controls that affect the whole platform — take care.</p>
        <div className="mt-4">
          <SiteSettingsForm settings={settings ?? []} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Categories</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(categories ?? []).map((c) => (
            <Card key={c.id} className="p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-ink-500">{c.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
