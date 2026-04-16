import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardProviders from "./providers";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_player_tag, main_clan_tag, clans_of_interest, display_name")
    .eq("id", user.id)
    .single();

  const { data: layoutRow } = await supabase
    .from("dashboard_layouts")
    .select("widgets, layouts")
    .eq("user_id", user.id)
    .single();

  const isProfileComplete = !!profile?.linked_player_tag;

  return (
    <main
      className="min-h-screen py-8 px-4 relative"
      style={{
        background: "var(--bg-base)",
        backgroundImage:
          "radial-gradient(ellipse at 20% 30%, rgba(251,191,36,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(99,102,241,0.06) 0%, transparent 55%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Your Dashboard</h1>
          <Link href="/profile" className="text-sm text-gray-400 hover:text-yellow-400 transition">
            Edit profile →
          </Link>
        </div>

        {!isProfileComplete ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Set up your profile first</h2>
            <p className="text-sm text-gray-400 mb-4">
              Link your player tag so widgets can show your data.
            </p>
            <Link
              href="/profile"
              className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Go to profile setup
            </Link>
          </div>
        ) : (
          <DashboardProviders>
            <DashboardClient
              widgets={(layoutRow?.widgets as DashboardWidget[] | null) ?? []}
              layouts={(layoutRow?.layouts as DashboardLayouts | null) ?? {}}
            />
          </DashboardProviders>
        )}
      </div>
    </main>
  );
}

export interface DashboardWidget {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface DashboardLayouts {
  lg?: LayoutItem[];
  sm?: LayoutItem[];
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}