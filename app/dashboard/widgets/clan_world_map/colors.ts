/** Tier 0 = most players, tier 3 = fewest */
export const TIER_COLORS = [
  { bg: "#f59e0b", text: "#000000" }, // amber  – tier 0 (dominant)
  { bg: "#f97316", text: "#000000" }, // orange – tier 1
  { bg: "#22c55e", text: "#000000" }, // green  – tier 2
  { bg: "#3b82f6", text: "#ffffff" }, // blue   – tier 3 (lowest)
] as const;

export type TierColor = (typeof TIER_COLORS)[number];

export function getCountryTier(count: number, maxCount: number): 0 | 1 | 2 | 3 {
  if (maxCount <= 0) return 3;
  const t = count / maxCount;
  if (t > 0.75) return 0;
  if (t > 0.50) return 1;
  if (t > 0.25) return 2;
  return 3;
}

export function getCountryColor(count: number, maxCount: number): TierColor {
  return TIER_COLORS[getCountryTier(count, maxCount)];
}
