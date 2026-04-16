"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { COUNTRY_CENTROIDS, countryCodeToFlag } from "./countryCentroids";
import type { CountryCluster } from "./types";

const GEO_URL = "/topojson/world-110m.json";

interface WorldMapProps {
  countries: CountryCluster[];
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
}

export default function WorldMap({
  countries,
  selectedCountry,
  onSelectCountry,
}: WorldMapProps) {
  const maxCount = Math.max(1, ...countries.map((c) => c.players.length));

  return (
    <div className="relative w-full h-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [10, 20] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--bg-surface-subtle)"
                  stroke="var(--border-subtle)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {countries.map((cluster) => {
            const coords = COUNTRY_CENTROIDS[cluster.countryCode];
            if (!coords) return null;

            const isSelected = selectedCountry === cluster.countryCode;
            const count = cluster.players.length;
            const radius = 4 + Math.sqrt(count / maxCount) * 14;

            return (
              <Marker
                key={cluster.countryCode}
                coordinates={coords}
                onClick={() =>
                  onSelectCountry(isSelected ? null : cluster.countryCode)
                }
              >
                <circle
                  r={radius}
                  fill={isSelected ? "var(--accent-text)" : "var(--accent-text)"}
                  fillOpacity={isSelected ? 0.9 : 0.55}
                  stroke={isSelected ? "var(--text-primary)" : "var(--accent-text)"}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                />
                {count > 0 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-primary)"
                    fontSize={radius > 10 ? 10 : 8}
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                  >
                    {count}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip for selected country */}
      {selectedCountry && (() => {
        const cluster = countries.find((c) => c.countryCode === selectedCountry);
        if (!cluster) return null;
        return (
          <div
            className="absolute top-3 left-3 z-20 rounded-xl px-4 py-3 backdrop-blur-md max-w-[220px]"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-glass)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {countryCodeToFlag(cluster.countryCode)} {cluster.countryName}
            </p>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              {cluster.players.length} player{cluster.players.length !== 1 ? "s" : ""}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
