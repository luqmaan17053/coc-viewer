"use client";

import { useQuery } from "@tanstack/react-query";

export function useClan(tag: string | null | undefined) {
  return useQuery({
    queryKey: ["clan", tag],
    queryFn: async () => {
      if (!tag) throw new Error("No tag");
      const res = await fetch("/api/clan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag: tag }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch clan ${tag}`);
      }
      return res.json();
    },
    enabled: !!tag,
  });
}