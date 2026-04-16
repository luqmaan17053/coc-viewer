"use client";

import { useState } from "react";
import { countryCodeToFlag } from "./countryCentroids";
import type { MemberLocation, MemberLocationsData } from "./types";

interface CountryListProps {
  data: MemberLocationsData;
}

export default function CountryList({ data }: CountryListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const locatedCount = data.totalMembers - data.unknownCount;

  function toggle(code: string) {
    setExpanded((prev) => (prev === code ? null : code));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary */}
      <div
        className="px-4 py-3 text-xs font-medium shrink-0"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {locatedCount} of {data.totalMembers} members located
        {data.countries.length > 0 && <> &middot; {data.countries.length} {data.countries.length === 1 ? "country" : "countries"}</>}
      </div>

      {/* Scrollable cards */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {data.countries.map((cluster) => (
          <CountryCard
            key={cluster.countryCode}
            flag={countryCodeToFlag(cluster.countryCode)}
            name={cluster.countryName}
            code={cluster.countryCode}
            players={cluster.players}
            isExpanded={expanded === cluster.countryCode}
            onToggle={() => toggle(cluster.countryCode)}
          />
        ))}

        {data.unknownCount > 0 && (
          <CountryCard
            flag="❓"
            name="Unknown"
            code="__unknown"
            players={data.unknownPlayers}
            isExpanded={expanded === "__unknown"}
            onToggle={() => toggle("__unknown")}
          />
        )}

        {data.countries.length === 0 && data.unknownCount === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No member location data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CountryCard({
  flag,
  name,
  code,
  players,
  isExpanded,
  onToggle,
}: {
  flag: string;
  name: string;
  code: string;
  players: MemberLocation[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface-subtle)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-[48px]"
      >
        <span className="text-xl shrink-0">{flag}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {players.length} player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: "var(--accent-text)", color: "var(--bg-base)" }}
        >
          {players.length}
        </span>
        <span
          className="text-xs shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {isExpanded && players.length > 0 && (
        <div
          className="px-4 pb-3 space-y-1"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {players.map((p) => (
            <div key={p.tag} className="flex items-center justify-between py-1.5 min-h-[44px]">
              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                {p.name}
              </span>
              <span className="shrink-0 ml-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                🏆{p.trophies}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
