"use client";

import { useState } from "react";
import PlayerTagSection from "./PlayerTagSection";
import MainClanSection from "./MainClanSection";
import ClansOfInterestSection from "./ClansOfInterestSection";
import SelectedCountriesSection from "./SelectedCountriesSection";

export default function ProfileEditor({
  initialPlayerTag,
  initialMainClanTag,
  initialClansOfInterest,
  initialSelectedCountries,
}: {
  initialPlayerTag: string | null;
  initialMainClanTag: string | null;
  initialClansOfInterest: string[];
  initialSelectedCountries: string[];
}) {
  const [playerTag, setPlayerTag] = useState<string | null>(initialPlayerTag);
  const [mainClanTag, setMainClanTag] = useState<string | null>(initialMainClanTag);
  const [clansOfInterest, setClansOfInterest] = useState<string[]>(initialClansOfInterest);
  const [suggestedClanTag, setSuggestedClanTag] = useState<string | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialSelectedCountries);

  return (
    <div className="space-y-4">
      <PlayerTagSection
        savedTag={playerTag}
        onSaved={(tag, suggestedClan) => {
          setPlayerTag(tag);
          setSuggestedClanTag(suggestedClan);
        }}
      />
      <MainClanSection
        savedTag={mainClanTag}
        suggestedTag={suggestedClanTag}
        onSaved={(tag) => {
          setMainClanTag(tag);
          setSuggestedClanTag(null);
        }}
      />
      <ClansOfInterestSection
        tags={clansOfInterest}
        mainClanTag={mainClanTag}
        onChange={(newInterests, newMain) => {
          setClansOfInterest(newInterests);
          if (newMain !== undefined) setMainClanTag(newMain);
        }}
      />
      <SelectedCountriesSection
        codes={selectedCountries}
        onSaved={setSelectedCountries}
      />
    </div>
  );
}