"use client";

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";
import { savePlayerTag } from "./actions";
import { usePlayerPreview } from "./useTagPreview";
import HashInput from "@/app/components/HashInput";

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

  useEffect(() => {
    if (!savedTag) { setSavedPlayer(null); return; }
    (async () => {
      try {
        const res = await fetch("/api/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerTag: savedTag }),
        });
        if (res.ok) setSavedPlayer(await res.json());
      } catch { /* silent */ }
    })();
  }, [savedTag]);

  const preview = usePlayerPreview(input);
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
    <section className="glass-panel">
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Your player tag</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Copy it from in-game (tap your name in your profile).</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <HashInput
            value={input}
            onChange={setInput}
            placeholder="ABC123XYZ"
            inputClassName="flex-1 glass-input"
          />
          <button
            type="submit"
            disabled={isPending || preview.status === "loading"}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 rounded-lg transition shrink-0"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>

        {preview.status === "loading" && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Looking up player...</p>}
        {preview.status === "error" && input.trim() !== "" && (
          <p className="text-sm text-red-400">{preview.message}</p>
        )}
        {showPreview && (
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Preview:</p>
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
  leagueTier?: { iconUrls?: { small?: string }; name?: string };
  clan?: { name: string; tag: string };
}

function PlayerCard({ player }: { player: PlayerData }) {
  const leagueIconUrl = player.leagueTier?.iconUrls?.small ?? player.league?.iconUrls?.small ?? null;
  const leagueName = player.leagueTier?.name ?? player.league?.name ?? "League";
  return (
    <div className="glass-mini-card flex items-center gap-3">
      {leagueIconUrl ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image src={leagueIconUrl} alt={leagueName} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="w-10 h-10 shrink-0 rounded-full" style={{ background: "var(--bg-surface-subtle)" }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{player.name}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
