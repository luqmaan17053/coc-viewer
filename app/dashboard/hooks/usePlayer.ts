"use client";

import { useQuery } from "@tanstack/react-query";

export function usePlayer(tag: string | null | undefined) {
  return useQuery({
    queryKey: ["player", tag],
    queryFn: async () => {
      if (!tag) throw new Error("No tag");
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerTag: tag }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch player ${tag}`);
      }
      return res.json();
    },
    enabled: !!tag,
  });
}