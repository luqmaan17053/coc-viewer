"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  linked_player_tag: string | null;
  main_clan_tag: string | null;
  clans_of_interest: string[];
  display_name: string | null;
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("linked_player_tag, main_clan_tag, clans_of_interest, display_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return {
        ...data,
        clans_of_interest: (data.clans_of_interest as string[] | null) ?? [],
      };
    },
    staleTime: 5 * 60_000,
  });
}