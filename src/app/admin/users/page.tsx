import { createClient, createServiceClient } from "@/lib/supabase/server";
import { RoleSelect } from "@/components/RoleSelect";

export const metadata = { title: "Admin — Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const service = createServiceClient();
  const { data: users } = await service
    .from("profiles")
    .select("id, username, display_name, role, subscription_status, monthly_generation_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-ink-500">{users?.length ?? 0} total (showing up to 100)</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-base-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-base-900 text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">Generations (month)</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-800">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.display_name ?? u.username}</td>
                <td className="px-4 py-3">
                  <RoleSelect userId={u.id} currentRole={u.role} disabled={u.id === currentUser?.id} />
                </td>
                <td className="px-4 py-3 text-ink-300">{u.subscription_status}</td>
                <td className="px-4 py-3 text-ink-300">{u.monthly_generation_count}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
