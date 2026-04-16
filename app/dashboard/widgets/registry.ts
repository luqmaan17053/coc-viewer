import type { WidgetDefinition } from "./types";
import { definition as playerStats } from "./player_stats";
import { definition as clanWorldMap } from "./clan_world_map";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_REGISTRY: Record<string, WidgetDefinition<any>> = {
  [playerStats.type]: playerStats,
  [clanWorldMap.type]: clanWorldMap,
};

export type WidgetType = keyof typeof WIDGET_REGISTRY;