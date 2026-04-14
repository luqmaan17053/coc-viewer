"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { saveMainClan } from "./actions";
import { useClanPreview } from "./useTagPreview";

export default function MainClanSection({
  savedTag,
  suggestedTag,
  onSaved,
}: {
  savedTag: string | null;
  suggestedTag: string | null;
  onSaved: (tag: string | null) => void;
}) {
  const [input, setInput] = useState(savedTag ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [savedClan, setSavedClan] = useState<ClanData | null>(null);

  // Auto-fill from suggestion (not auto-save) — only when field is empty
  useEffect(() => {
    if (suggestedTag && input.trim() === "") setInput(suggestedTag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedTag]);

  // Keep input in sync with savedTag (so promote/demote from other section reflects here)
  useEffect(() => {
    setInput(savedTag ?? "");
  }, [savedTag]);

  // Fetch saved clan data
  useEffect(() => {
    if (!savedTag) {
      setSavedClan(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/clan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clanTag: savedTag }),
        });
        if (res.ok) setSavedClan(await res.json());
      } catch {
        // silent
      }
    })();
  }, [savedTag]);

  const preview = useClanPreview(input);
  const showPreview =
    preview.status === "success" &&
    input.trim() !== "" &&
    normalizeForCompare(input) !== normalizeForCompare(savedTag ?? "");

  const showSuggestionBanner = suggestedTag && input === suggestedTag && savedTag !== suggestedTag;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("clanTag", input);

    startTransition(async () => {
      const result = await saveMainClan(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        const normalized = input.trim() === "" ? null : `#${input.trim().replace(/^#/, "").toUpperCase()}`;
        onSaved(normalized);
      }
    });
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold text-white">Main clan</h2>
        <span className="text-yellow-400 text-sm">⭐</span>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        The clan you want to monitor most. Doesn&apos;t have to be your current clan. Leave empty to skip.
      </p>

      {showSuggestionBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg px-3 py-2 mb-3 text-xs">
          💡 Auto-filled from your player&apos;s current clan. Click Save to confirm, or change it.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#CLAN12345"
            autoComplete="off"
            className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition font-mono"
          />
          <button
            type="submit"
            disabled={isPending || preview.status === "loading"}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 rounded-lg transition"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>

        {preview.status === "loading" && <p className="text-xs text-gray-500">Looking up clan...</p>}
        {preview.status === "error" && input.trim() !== "" && (
          <p className="text-sm text-red-400">{preview.message}</p>
        )}

        {showPreview && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <ClanCard clan={preview.data} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {savedClan && !showPreview && (
          <div>
            <p className="text-xs text-green-500 mb-1">✓ Saved</p>
            <ClanCard clan={savedClan} />
          </div>
        )}
      </form>
    </section>
  );
}

export interface ClanData {
  tag: string;
  name: string;
  clanLevel: number;
  members: number;
  badgeUrls?: { small?: string; medium?: string };
}

export function ClanCard({ clan }: { clan: ClanData }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5">
      {clan.badgeUrls?.small ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image src={clan.badgeUrls.small} alt={clan.name} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="w-10 h-10 shrink-0 bg-gray-700 rounded-full" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{clan.name}</p>
        <p className="text-xs text-gray-500 font-mono">{clan.tag}</p>
        <p className="text-xs text-gray-500">Level {clan.clanLevel} · {clan.members}/50</p>
      </div>
    </div>
  );
}

function normalizeForCompare(raw: string): string {
  return raw.trim().replace(/^#/, "").toUpperCase();
}