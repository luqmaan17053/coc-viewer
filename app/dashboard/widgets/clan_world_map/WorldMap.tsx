"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { COUNTRY_CENTROIDS, countryCodeToFlag } from "./countryCentroids";
import { getCountryColor } from "./colors";
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

  // Fast lookup: iso_a2 → cluster
  const clusterMap = new Map(countries.map((c) => [c.countryCode, c]));

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
              geographies.map((geo) => {
                const iso = geo.properties?.iso_a2 as string | undefined;
                const cluster = iso && iso !== "-99" ? clusterMap.get(iso) : undefined;
                const isSelected = cluster && selectedCountry === iso;
                const tierColor = cluster
                  ? getCountryColor(cluster.players.length, maxCount)
                  : null;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      tierColor
                        ? isSelected
                          ? `${tierColor.bg}bb`   // ~73% opacity when selected
                          : `${tierColor.bg}50`   // ~31% opacity when normal
                        : "var(--map-country-base)"
                    }
                    stroke={tierColor ? `${tierColor.bg}99` : "var(--map-country-stroke)"}
                    strokeWidth={tierColor ? 0.8 : 0.5}
                    onClick={
                      cluster && iso
                        ? () => onSelectCountry(isSelected ? null : iso)
                        : undefined
                    }
                    style={{
                      default: {
                        outline: "none",
                        cursor: cluster ? "pointer" : "default",
                        transition: "fill 0.2s",
                      },
                      hover: {
                        outline: "none",
                        fill: tierColor ? `${tierColor.bg}80` : "var(--map-country-base)",
                        cursor: cluster ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {countries.map((cluster) => {
            const coords = COUNTRY_CENTROIDS[cluster.countryCode];
            if (!coords) return null;

            const isSelected = selectedCountry === cluster.countryCode;
            const count = cluster.players.length;
            const radius = 4 + Math.sqrt(count / maxCount) * 12;
            const tierColor = getCountryColor(count, maxCount);

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
                  fill={tierColor.bg}
                  fillOpacity={isSelected ? 0.95 : 0.75}
                  stroke={isSelected ? "#fff" : tierColor.bg}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 0.9 : 0.5}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                />
                {count > 0 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={tierColor.text}
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
        const tierColor = getCountryColor(cluster.players.length, maxCount);
        return (
          <div
            className="absolute top-3 left-3 z-20 rounded-xl px-4 py-3 backdrop-blur-md max-w-[220px]"
            style={{
              background: "var(--bg-surface)",
              border: `1px solid ${tierColor.bg}66`,
              boxShadow: `var(--glass-shadow), 0 0 0 1px ${tierColor.bg}33`,
            }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {countryCodeToFlag(cluster.countryCode)} {cluster.countryName}
            </p>
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: tierColor.bg }}
              />
              {cluster.players.length} player{cluster.players.length !== 1 ? "s" : ""}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
