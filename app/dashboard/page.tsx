import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LinkedTagForm from "./LinkedTagForm";

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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Your Dashboard</h1>
          <p className="text-gray-400 mt-1">Signed in as {user.email}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Link your CoC account</h2>
          <p className="text-sm text-gray-400 mb-4">
            Save your player tag here and your dashboard will remember it across visits.
          </p>
          <LinkedTagForm initialTag={profile?.linked_player_tag ?? null} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Coming soon</h2>
          <p className="text-sm text-gray-400">
            Drag-and-drop widget canvas with desktop and mobile layouts. You'll be able to build a custom view of your stats, clan info, war log, and more.
          </p>
        </div>
      </div>
    </main>
  );
}