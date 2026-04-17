"use client";

import { useEffect, useRef } from "react";
import { countryCodeToFlag } from "./countryCentroids";
import { getCountryColor } from "./colors";
import type { CountryCluster, MemberLocation, MemberLocationsData } from "./types";

interface SidebarProps {
  data: MemberLocationsData;
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
}

export default function Sidebar({ data, selectedCountry, onSelectCountry }: SidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const locatedCount = data.totalMembers - data.unknownCount;

  // Scroll to selected country
  useEffect(() => {
    if (!selectedCountry) return;
    const el = itemRefs.current.get(selectedCountry);
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedCountry]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary */}
      <div
        className="px-4 py-2.5 text-xs font-medium shrink-0"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {locatedCount} of {data.totalMembers} members located
        {data.countries.length > 0 && <> &middot; {data.countries.length} {data.countries.length === 1 ? "country" : "countries"}</>}
      </div>

      {/* Scrollable list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {(() => {
          const maxCount = Math.max(1, ...data.countries.map((c) => c.players.length));
          return data.countries.map((cluster) => (
            <CountryGroup
              key={cluster.countryCode}
              cluster={cluster}
              maxCount={maxCount}
              isSelected={selectedCountry === cluster.countryCode}
              onSelect={() =>
                onSelectCountry(selectedCountry === cluster.countryCode ? null : cluster.countryCode)
              }
              ref={(el) => {
                if (el) itemRefs.current.set(cluster.countryCode, el);
                else itemRefs.current.delete(cluster.countryCode);
              }}
            />
          ));
        })()}

        {/* Unknown group */}
        {data.unknownCount > 0 && (
          <UnknownGroup
            count={data.unknownCount}
            players={data.unknownPlayers}
            isSelected={selectedCountry === "__unknown"}
            onSelect={() =>
              onSelectCountry(selectedCountry === "__unknown" ? null : "__unknown")
            }
          />
        )}
      </div>
    </div>
  );
}

import { forwardRef } from "react";

const CountryGroup = forwardRef<
  HTMLDivElement,
  {
    cluster: CountryCluster;
    maxCount: number;
    isSelected: boolean;
    onSelect: () => void;
  }
>(function CountryGroup({ cluster, maxCount, isSelected, onSelect }, ref) {
  const tierColor = getCountryColor(cluster.players.length, maxCount);
  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
        style={{
          background: isSelected ? `${tierColor.bg}18` : "transparent",
          border: isSelected ? `1px solid ${tierColor.bg}55` : "1px solid transparent",
        }}
      >
        {/* Tier color dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: tierColor.bg }}
        />
        <span className="text-base shrink-0">{countryCodeToFlag(cluster.countryCode)}</span>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {cluster.countryName}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: tierColor.bg, color: tierColor.text }}
        >
          {cluster.players.length}
        </span>
      </button>

      {isSelected && (
        <div className="pl-11 pr-3 pb-1 space-y-0.5">
          {cluster.players.map((p) => (
            <PlayerRow key={p.tag} player={p} />
          ))}
        </div>
      )}
    </div>
  );
});

function UnknownGroup({
  count,
  players,
  isSelected,
  onSelect,
}: {
  count: number;
  players: MemberLocation[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
        style={{
          background: isSelected ? "var(--bg-surface-subtle)" : "transparent",
          border: isSelected ? "1px solid var(--border-glass)" : "1px solid transparent",
        }}
      >
        <span className="text-base shrink-0">❓</span>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text-muted)" }}>
          Unknown
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "var(--text-muted)", color: "var(--bg-base)" }}
        >
          {count}
        </span>
      </button>

      {isSelected && players.length > 0 && (
        <div className="pl-10 pr-3 pb-1 space-y-0.5">
          {players.map((p) => (
            <PlayerRow key={p.tag} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player }: { player: MemberLocation }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs gap-2">
      <span
        className="shrink-0 font-mono w-7 text-right"
        style={{ color: "var(--text-muted)" }}
      >
        #{player.rank}
      </span>
      <span className="flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
        {player.name}
      </span>
      <span className="shrink-0 font-mono" style={{ color: "var(--text-muted)" }}>
        🏆{player.trophies}
      </span>
    </div>
  );
}
