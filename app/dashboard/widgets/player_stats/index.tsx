import type { WidgetDefinition } from "../types";
import PlayerStatsWidget from "./Widget";

type PlayerStatsConfig = Record<string, never>;

export const definition: WidgetDefinition<PlayerStatsConfig> = {
  type: "player_stats",
  displayName: "Player Stats",
  description: "Your player profile card",
  icon: "👤",
  defaultConfig: {},
  defaultLayout: {
  lg: { w: 4, h: 5, minW: 3, minH: 5 },
  sm: { w: 1, h: 5, minH: 5 },
},
  Widget: PlayerStatsWidget,
  ConfigForm: null,
};