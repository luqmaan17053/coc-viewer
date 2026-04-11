import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_player_tag, display_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Your Dashboard</h1>
          <p className="text-gray-400 mt-1">Signed in as {user.email}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="text-gray-400 w-40">User ID</dt>
              <dd className="text-gray-200 font-mono text-xs">{user.id}</dd>
            </div>
            <div className="flex">
              <dt className="text-gray-400 w-40">Linked player tag</dt>
              <dd className="text-gray-200">{profile?.linked_player_tag || <span className="text-gray-600 italic">not set</span>}</dd>
            </div>
            <div className="flex">
              <dt className="text-gray-400 w-40">Display name</dt>
              <dd className="text-gray-200">{profile?.display_name || <span className="text-gray-600 italic">not set</span>}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500 mt-6">Widget canvas coming soon. Phase 3 will let you link your CoC tag here.</p>
        </div>
      </div>
    </main>
  );
}