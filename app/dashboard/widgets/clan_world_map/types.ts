import type { ClanRef } from "../../hooks";

export interface ClanWorldMapConfig {
  clanRef: ClanRef;
  countrySource: "profile" | "custom";
  countryCodes: string[];    // ISO alpha-2 codes, max 10
  topCount: number;          // 1-200, default 200
}

export interface MemberLocation {
  name: string;
  tag: string;
  trophies: number;
  expLevel: number;
}

export interface CountryCluster {
  countryCode: string;
  countryName: string;
  players: MemberLocation[];
}

export interface MemberLocationsData {
  countries: CountryCluster[];
  unknownCount: number;
  unknownPlayers: MemberLocation[];
  totalMembers: number;
  searchedCountries: string[];
}
