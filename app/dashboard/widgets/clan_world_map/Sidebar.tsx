"use client";

import { useEffect, useRef } from "react";
import { countryCodeToFlag } from "./countryCentroids";
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
        {data.countries.map((cluster) => (
          <CountryGroup
            key={cluster.countryCode}
            cluster={cluster}
            isSelected={selectedCountry === cluster.countryCode}
            onSelect={() =>
              onSelectCountry(selectedCountry === cluster.countryCode ? null : cluster.countryCode)
            }
            ref={(el) => {
              if (el) itemRefs.current.set(cluster.countryCode, el);
              else itemRefs.current.delete(cluster.countryCode);
            }}
          />
        ))}

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
    isSelected: boolean;
    onSelect: () => void;
  }
>(function CountryGroup({ cluster, isSelected, onSelect }, ref) {
  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
        style={{
          background: isSelected ? "var(--bg-surface-subtle)" : "transparent",
          border: isSelected ? "1px solid var(--border-glass)" : "1px solid transparent",
        }}
      >
        <span className="text-base shrink-0">{countryCodeToFlag(cluster.countryCode)}</span>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {cluster.countryName}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "var(--accent-text)", color: "var(--bg-base)" }}
        >
          {cluster.players.length}
        </span>
      </button>

      {isSelected && (
        <div className="pl-10 pr-3 pb-1 space-y-0.5">
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
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="truncate" style={{ color: "var(--text-secondary)" }}>
        {player.name}
      </span>
      <span className="shrink-0 ml-2 font-mono" style={{ color: "var(--text-muted)" }}>
        🏆{player.trophies}
      </span>
    </div>
  );
}
