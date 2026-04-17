"use client";

import { useEffect, useState, useTransition, useMemo, useRef } from "react";
import { saveSelectedCountries } from "./actions";

interface LocationItem {
  id: number;
  name: string;
  countryCode: string;
}

function countryCodeToFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default function SelectedCountriesSection({
  codes,
  onSaved,
}: {
  codes: string[];
  onSaved: (codes: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(codes);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch locations list
  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
        !selected.includes(l.countryCode) &&
        (l.name.toLowerCase().includes(q) || l.countryCode.toLowerCase().includes(q))
    );
  }, [locations, search, selected]);

  const isDirty = JSON.stringify(selected) !== JSON.stringify(codes);

  function addCountry(code: string) {
    if (selected.length >= 10) return;
    setSelected((prev) => [...prev, code]);
    setSearch("");
  }

  function removeCountry(code: string) {
    setSelected((prev) => prev.filter((c) => c !== code));
  }

  function handleSave() {
    setError("");
    setSuccessMsg("");
    startTransition(async () => {
      const result = await saveSelectedCountries(selected);
      if (result?.error) {
        setError(result.error);
      } else {
        onSaved(selected);
        setSuccessMsg("Saved!");
        setTimeout(() => setSuccessMsg(""), 2000);
      }
    });
  }

  return (
    <section className="glass-panel">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Countries for World Map
        </h2>
        <span className="text-sm">🌍</span>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Select up to 10 countries. The Clan World Map widget can use these to find your clan
        members on country leaderboards.
      </p>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
              style={{
                background: "var(--bg-surface-subtle)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {countryCodeToFlag(code)} {nameMap[code] || code}
              <button
                type="button"
                onClick={() => removeCountry(code)}
                className="ml-0.5 hover:text-red-400 transition"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + dropdown */}
      {selected.length < 10 && (
        <div ref={wrapperRef}>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Search countries..."
            className="glass-input w-full"
          />
          {dropdownOpen && filtered.length > 0 && (
            <div
              className="mt-1 w-full max-h-48 overflow-y-auto rounded-lg shadow-lg"
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
                    addCountry(loc.countryCode);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-500/10 transition flex items-center gap-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {countryCodeToFlag(loc.countryCode)} {loc.name}
                  <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                    {loc.countryCode}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected.length >= 10 && (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Maximum 10 countries reached. Remove one to add another.
        </p>
      )}

      {/* Save */}
      {isDirty && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 py-2 rounded-lg transition text-sm"
          >
            {isPending ? "Saving..." : "Save countries"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(codes)}
            className="text-sm hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            Reset
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {successMsg && <p className="text-sm text-green-400 mt-2">{successMsg}</p>}
    </section>
  );
}
