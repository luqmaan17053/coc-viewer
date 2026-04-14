"use client";

import { useEffect, useState } from "react";

// Returns "lg" when viewport ≥ 1024, "sm" otherwise.
// Used for gating edit affordances — mobile is view-only per spec 6.5.
export function useBreakpoint(): "lg" | "sm" {
  // Default to "lg" on server to match our SSR-safe grid wrapper.
  // Once mounted, we switch to the real viewport.
  const [bp, setBp] = useState<"lg" | "sm">("lg");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setBp(mq.matches ? "lg" : "sm");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return bp;
}