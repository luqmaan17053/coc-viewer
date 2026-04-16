import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_player_tag, main_clan_tag, clans_of_interest, display_name, selected_countries")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen py-8 px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Profile setup</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Link your CoC account and the clans you want to track. Widgets on your dashboard will use these.
          </p>
        </div>

        <ProfileEditor
          initialPlayerTag={profile?.linked_player_tag ?? null}
          initialMainClanTag={profile?.main_clan_tag ?? null}
          initialClansOfInterest={(profile?.clans_of_interest as string[] | null) ?? []}
          initialSelectedCountries={(profile?.selected_countries as string[] | null) ?? []}
        />
      </div>
    </main>
  );
}