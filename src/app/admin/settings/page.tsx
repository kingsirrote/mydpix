import { createServiceClient } from "@/lib/supabase/server";
import { SiteSettingsForm } from "@/components/SiteSettingsForm";
import { CategoriesManager } from "@/components/CategoriesManager";

export const metadata = { title: "Admin — Settings" };
export const dynamic = "force-dynamic";

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
        <div className="mt-4">
          <CategoriesManager categories={categories ?? []} />
        </div>
      </div>
    </div>
  );
}
