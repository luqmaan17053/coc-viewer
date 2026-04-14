import type { WidgetDefinition } from "../types";
import PlayerStatsWidget, { type PlayerStatsConfig } from "./Widget";
import PlayerStatsConfigForm from "./ConfigForm";

export const definition: WidgetDefinition<PlayerStatsConfig> = {
  type: "player_stats",
  displayName: "Player Stats",
  description: "Any player's profile card (their stats, league, clan).",
  icon: "👤",
  defaultConfig: { useLinkedPlayer: true, playerTag: null },
  defaultLayout: {
    lg: { w: 4, h: 5, minW: 3, minH: 5 },
    sm: { w: 1, h: 5, minH: 5 },
  },
  requiresConfigOnAdd: true,
  Widget: PlayerStatsWidget,
  ConfigForm: PlayerStatsConfigForm,
};