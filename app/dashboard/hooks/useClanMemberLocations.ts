"use client";

import { useQuery } from "@tanstack/react-query";

export function useClanMemberLocations(
  tag: string | null | undefined,
  countryCodes: string[],
  topCount: number,
  searchAll = false
) {
  return useQuery({
    queryKey: ["clan-member-locations", tag, searchAll ? "__all__" : countryCodes, topCount],
    queryFn: async () => {
      if (!tag) throw new Error("No tag");
      const res = await fetch("/api/clan-member-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag: tag, countryCodes, topCount, searchAll }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch member locations");
      }
      return res.json();
    },
    enabled: !!tag && (searchAll || countryCodes.length > 0),
    staleTime: searchAll ? 30 * 60_000 : 5 * 60_000,
  });
}
