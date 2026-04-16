"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useClanRef, useClanMemberLocations, useProfile } from "../../hooks";
import { useBreakpoint } from "../../useBreakpoint";
import type { WidgetProps } from "../types";
import type { ClanWorldMapConfig, MemberLocationsData } from "./types";
import { countryCodeToFlag } from "./countryCentroids";
import Sidebar from "./Sidebar";
import CountryList from "./CountryList";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function ClanWorldMapWidget({
  config,
  editMode,
  onRemove,
  onOpenConfig,
}: WidgetProps<ClanWorldMapConfig>) {
  const clanRef = useClanRef(config.clanRef);
  const profileQuery = useProfile();
  const bp = useBreakpoint();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Resolve country codes from profile or config
  const countryCodes =
    config.countrySource === "profile"
      ? profileQuery.data?.selected_countries ?? []
      : config.countryCodes ?? [];
  const topCount = config.topCount ?? 200;

  const locationsQuery = useClanMemberLocations(clanRef.tag, countryCodes, topCount);
  const data = locationsQuery.data as MemberLocationsData | undefined;
  const isLoading = !clanRef.resolved || locationsQuery.isLoading;
  const error = locationsQuery.error;
  const noTag = clanRef.resolved && !clanRef.tag;
  const noCountries = countryCodes.length === 0;

  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden flex flex-col backdrop-blur-md"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-glass)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      {editMode && (
        <WidgetChrome title="Clan World Map" onRemove={onRemove} onOpenConfig={onOpenConfig} />
      )}

      <div className={`flex-1 overflow-hidden flex flex-col ${editMode ? "pt-8" : ""}`}>
        {/* Header bar with flags + top count */}
        {countryCodes.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 shrink-0 overflow-x-auto"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {countryCodes.map((code) => (
                <span key={code} className="text-base" title={code}>
                  {countryCodeToFlag(code)}
                </span>
              ))}
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "var(--bg-surface-subtle)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Top {topCount}
            </span>
            {data && (
              <span
                className="text-xs ml-auto shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {data.totalMembers - data.unknownCount} of {data.totalMembers} located
              </span>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {noTag && (
            <NoClanState editMode={editMode} onOpenConfig={onOpenConfig} isOrphaned={clanRef.isOrphaned} />
          )}
          {!noTag && noCountries && <NoCountriesState editMode={editMode} onOpenConfig={onOpenConfig} />}
          {!noTag && !noCountries && isLoading && <LoadingState />}
          {!noTag && !noCountries && !isLoading && error && (
            <ErrorState message={(error as Error).message} />
          )}
          {!noTag && !noCountries && !isLoading && !error && data && (
            bp === "lg" ? (
              <DesktopLayout
                data={data}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
              />
            ) : (
              <CountryList data={data} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopLayout({
  data,
  selectedCountry,
  onSelectCountry,
}: {
  data: MemberLocationsData;
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-[2] min-w-0 h-full">
        <WorldMap
          countries={data.countries}
          selectedCountry={selectedCountry}
          onSelectCountry={onSelectCountry}
        />
      </div>
      <div
        className="w-[300px] shrink-0 h-full"
        style={{ borderLeft: "1px solid var(--border-subtle)" }}
      >
        <Sidebar
          data={data}
          selectedCountry={selectedCountry}
          onSelectCountry={onSelectCountry}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Searching leaderboards...
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

function NoClanState({
  editMode,
  onOpenConfig,
  isOrphaned,
}: {
  editMode: boolean;
  onOpenConfig: () => void;
  isOrphaned: boolean;
}) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <div>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          {isOrphaned
            ? "The referenced clan was removed from your profile."
            : "No clan configured."}
        </p>
        {editMode && (
          <button
            type="button"
            onClick={onOpenConfig}
            className="text-xs hover:underline"
            style={{ color: "var(--accent-text)" }}
          >
            Click to configure
          </button>
        )}
      </div>
    </div>
  );
}

function NoCountriesState({
  editMode,
  onOpenConfig,
}: {
  editMode: boolean;
  onOpenConfig: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <div>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          No countries selected. Configure countries to search leaderboards.
        </p>
        {editMode && (
          <button
            type="button"
            onClick={onOpenConfig}
            className="text-xs hover:underline"
            style={{ color: "var(--accent-text)" }}
          >
            Click to configure
          </button>
        )}
      </div>
    </div>
  );
}

function WidgetChrome({
  title,
  onRemove,
  onOpenConfig,
}: {
  title: string;
  onRemove: () => void;
  onOpenConfig: () => void;
}) {
  return (
    <div
      className="absolute top-0 left-0 right-0 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between z-10"
      style={{ background: "var(--bg-surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span className="widget-drag-handle cursor-move text-xs font-semibold select-none" style={{ color: "var(--text-secondary)" }}>
        ⠿ {title}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenConfig}
          className="text-gray-400 hover:text-yellow-400 w-6 h-6 flex items-center justify-center transition text-sm"
          title="Configure"
        >
          ⚙
        </button>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-400 w-6 h-6 flex items-center justify-center transition text-sm"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
