"use client";

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";
import { savePlayerTag } from "./actions";
import { usePlayerPreview } from "./useTagPreview";

export default function PlayerTagSection({
  savedTag,
  onSaved,
}: {
  savedTag: string | null;
  onSaved: (tag: string | null, suggestedClanTag: string | null) => void;
}) {
  const [input, setInput] = useState(savedTag ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [savedPlayer, setSavedPlayer] = useState<PlayerData | null>(null);

  // Fetch saved player data whenever savedTag changes
  useEffect(() => {
    if (!savedTag) {
      setSavedPlayer(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerTag: savedTag }),
        });
        if (res.ok) setSavedPlayer(await res.json());
      } catch {
        // silent
      }
    })();
  }, [savedTag]);

  const preview = usePlayerPreview(input);
  // Only show preview when input differs from what's saved
  const showPreview =
    preview.status === "success" &&
    input.trim() !== "" &&
    normalizeForCompare(input) !== normalizeForCompare(savedTag ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("playerTag", input);

    startTransition(async () => {
      const result = await savePlayerTag(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        const normalized = input.trim() === "" ? null : `#${input.trim().replace(/^#/, "").toUpperCase()}`;
        onSaved(normalized, result.suggestedClanTag ?? null);
      }
    });
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Your player tag</h2>
      <p className="text-sm text-gray-400 mb-4">Copy it from in-game (tap your name in your profile).</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#ABC123XYZ"
            autoComplete="off"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition font-mono"
          />
          <button
            type="submit"
            disabled={isPending || preview.status === "loading"}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 rounded-lg transition"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>

        {preview.status === "loading" && <p className="text-xs text-gray-500">Looking up player...</p>}
        {preview.status === "error" && input.trim() !== "" && (
          <p className="text-sm text-red-400">{preview.message}</p>
        )}

        {showPreview && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <PlayerCard player={preview.data} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {savedPlayer && !showPreview && (
          <div>
            <p className="text-xs text-green-500 mb-1">✓ Saved</p>
            <PlayerCard player={savedPlayer} />
          </div>
        )}
      </form>
    </section>
  );
}

interface PlayerData {
  name: string;
  tag: string;
  townHallLevel: number;
  trophies: number;
  league?: { iconUrls?: { small?: string; tiny?: string }; name?: string };
  clan?: { name: string; tag: string };
}

function PlayerCard({ player }: { player: PlayerData }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5">
      {player.league?.iconUrls?.small ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image src={player.league.iconUrls.small} alt={player.league.name ?? "League"} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="w-10 h-10 shrink-0 bg-gray-700 rounded-full" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
        <p className="text-xs text-gray-500">
          TH{player.townHallLevel} · {player.trophies.toLocaleString()} 🏆
          {player.clan && <> · {player.clan.name}</>}
        </p>
      </div>
    </div>
  );
}

function normalizeForCompare(raw: string): string {
  return raw.trim().replace(/^#/, "").toUpperCase();
}