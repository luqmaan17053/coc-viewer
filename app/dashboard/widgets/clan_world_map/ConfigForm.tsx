"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WidgetConfigFormProps } from "../types";
import type { ClanWorldMapConfig } from "./types";
import { useClanPreview } from "@/app/profile/useTagPreview";
import { useProfile } from "../../hooks";
import HashInput from "@/app/components/HashInput";
import { countryCodeToFlag } from "./countryCentroids";

interface LocationItem {
  id: number;
  name: string;
  countryCode: string;
}

export default function ClanWorldMapConfigForm({
  initialConfig,
  onSave,
  onCancel,
}: WidgetConfigFormProps<ClanWorldMapConfig>) {
  // --- Clan selection (existing) ---
  const isMainInitially = initialConfig.clanRef.kind === "main";
  const initialTag =
    initialConfig.clanRef.kind !== "main" ? initialConfig.clanRef.tag : "";

  const [useMain, setUseMain] = useState(isMainInitially);
  const [tagInput, setTagInput] = useState(initialTag.replace(/^#/, ""));
  const preview = useClanPreview(useMain ? "" : tagInput);

  const normalized =
    tagInput.trim() === ""
      ? null
      : `#${tagInput.trim().replace(/^#/, "").toUpperCase()}`;

  // --- Country selection ---
  const [countrySource, setCountrySource] = useState<"profile" | "custom">(
    initialConfig.countrySource ?? "profile"
  );
  const [customCodes, setCustomCodes] = useState<string[]>(
    initialConfig.countryCodes ?? []
  );
  const [topCount, setTopCount] = useState(initialConfig.topCount ?? 200);

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileQuery = useProfile();
  const profileCountries = profileQuery.data?.selected_countries ?? [];

  // Fetch locations for country picker
  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    locations.forEach((l) => (m[l.countryCode] = l.name));
    return m;
  }, [locations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        !customCodes.includes(l.countryCode) &&
        (l.name.toLowerCase().includes(q) || l.countryCode.toLowerCase().includes(q))
    );
  }, [locations, search, customCodes]);

  // --- Validation ---
  const clanValid = useMain || (preview.status === "success" && normalized);
  const activeCodes = countrySource === "profile" ? profileCountries : customCodes;
  const countriesValid = activeCodes.length > 0;
  const canSave = clanValid && countriesValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      clanRef: useMain
        ? { kind: "main" }
        : { kind: "local", tag: normalized! },
      countrySource,
      countryCodes: countrySource === "custom" ? customCodes : [],
      topCount: Math.max(1, Math.min(200, topCount)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ---- Section 1: Clan ---- */}
      <div>
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Clan
        </h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useMain}
            onChange={(e) => setUseMain(e.target.checked)}
            className="w-5 h-5 accent-yellow-500 mt-0.5 shrink-0"
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Use my main clan
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Follows whatever clan you set as main in Profile.
            </p>
          </div>
        </label>

        {!useMain && (
          <div className="mt-3">
            <HashInput
              value={tagInput}
              onChange={setTagInput}
              placeholder="2RC8G8P9R"
              inputClassName="glass-input"
            />
            {preview.status === "loading" && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Looking up clan...
              </p>
            )}
            {preview.status === "error" && tagInput.trim() !== "" && (
              <p className="text-sm text-red-400 mt-1">{preview.message}</p>
            )}
            {preview.status === "success" && (
              <div className="mt-2">
                <ClanPreviewCard clan={preview.data} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Section 2: Countries ---- */}
      <div>
        <h3
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Countries to search
        </h3>

        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={countrySource === "profile"}
              onChange={() => setCountrySource("profile")}
              className="accent-yellow-500"
            />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Use profile countries
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={countrySource === "custom"}
              onChange={() => setCountrySource("custom")}
              className="accent-yellow-500"
            />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Custom
            </span>
          </label>
        </div>

        {countrySource === "profile" && (
          <div>
            {profileCountries.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No countries set in your profile.{" "}
                <a href="/profile" className="underline" style={{ color: "var(--accent-text)" }}>
                  Go to Profile
                </a>{" "}
                to add some.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profileCountries.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: "var(--bg-surface-subtle)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {countryCodeToFlag(code)} {nameMap[code] || code}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {countrySource === "custom" && (
          <div>
            {/* Selected chips */}
            {customCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customCodes.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: "var(--bg-surface-subtle)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {countryCodeToFlag(code)} {nameMap[code] || code}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomCodes((prev) => prev.filter((c) => c !== code))
                      }
                      className="ml-0.5 hover:text-red-400 transition"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            {customCodes.length < 10 && (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search countries..."
                  className="glass-input w-full text-sm"
                />
                {dropdownOpen && filtered.length > 0 && (
                  <div
                    className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-lg shadow-lg"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-glass)",
                    }}
                  >
                    {filtered.slice(0, 50).map((loc) => (
                      <button
                        key={loc.countryCode}
                        type="button"
                        onClick={() => {
                          setCustomCodes((prev) => [...prev, loc.countryCode]);
                          setSearch("");
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-yellow-500/10 transition flex items-center gap-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {countryCodeToFlag(loc.countryCode)} {loc.name}
                        <span
                          className="ml-auto text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {loc.countryCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {customCodes.length >= 10 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Maximum 10 countries. Remove one to add another.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- Section 3: Top count ---- */}
      <div>
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Leaderboard depth
        </h3>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          How many top players per country to check (1–200). Higher = more
          matches but slower.
        </p>
        <input
          type="number"
          min={1}
          max={200}
          value={topCount}
          onChange={(e) => setTopCount(Number(e.target.value) || 200)}
          className="glass-input w-24 text-sm"
        />
      </div>

      {/* ---- Buttons ---- */}
      {!countriesValid && (
        <p className="text-xs text-red-400">
          Select at least one country to search.
        </p>
      )}

      <div
        className="flex gap-2 pt-2 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border hover:border-gray-500 text-sm font-semibold py-2.5 rounded-lg transition"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 text-sm font-semibold py-2.5 rounded-lg transition"
        >
          Save
        </button>
      </div>
    </form>
  );
}

interface PreviewClan {
  name: string;
  tag: string;
  clanLevel: number;
  members: number;
  badgeUrls?: { small?: string };
}

function ClanPreviewCard({ clan }: { clan: PreviewClan }) {
  return (
    <div className="glass-mini-card flex items-center gap-3">
      {clan.badgeUrls?.small ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src={clan.badgeUrls.small}
            alt={clan.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="w-10 h-10 shrink-0 rounded-full"
          style={{ background: "var(--bg-surface-subtle)" }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {clan.name}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Level {clan.clanLevel} &middot; {clan.members} members
        </p>
      </div>
    </div>
  );
}
