import type { WidgetDefinition } from "../types";
import ClanWorldMapWidget from "./Widget";
import ClanWorldMapConfigForm from "./ConfigForm";
import type { ClanWorldMapConfig } from "./types";

export const definition: WidgetDefinition<ClanWorldMapConfig> = {
  type: "clan_world_map",
  displayName: "Clan World Map",
  description: "Find your clan members on country leaderboards and plot them on a world map.",
  icon: "🌍",
  defaultConfig: {
    clanRef: { kind: "main" },
    countrySource: "profile",
    countryCodes: [],
    topCount: 200,
  },
  defaultLayout: {
    lg: { w: 12, h: 7, minW: 12, maxW: 12, minH: 5 },
    sm: { w: 1, h: 8, minH: 6 },
  },
  requiresConfigOnAdd: true,
  Widget: ClanWorldMapWidget,
  ConfigForm: ClanWorldMapConfigForm,
};
