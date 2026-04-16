"use client";

import Image from "next/image";
import { useState } from "react";
import type { WidgetConfigFormProps } from "../types";
import type { PlayerStatsConfig } from "./Widget";
import { usePlayerPreview } from "@/app/profile/useTagPreview";
import HashInput from "@/app/components/HashInput";

export default function PlayerStatsConfigForm({
  initialConfig,
  onSave,
  onCancel,
}: WidgetConfigFormProps<PlayerStatsConfig>) {
    const [useLinked, setUseLinked] = useState(initialConfig.useLinkedPlayer ?? false);
    const [tagInput, setTagInput] = useState(initialConfig.playerTag ?? "");

  const preview = usePlayerPreview(useLinked ? "" : tagInput);

  const normalized = tagInput.trim() === ""
    ? null
    : `#${tagInput.trim().replace(/^#/, "").toUpperCase()}`;

  const canSave = useLinked || (preview.status === "success" && normalized);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      useLinkedPlayer: useLinked,
      playerTag: useLinked ? null : normalized,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Follow-linked-player toggle */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={useLinked}
          onChange={(e) => setUseLinked(e.target.checked)}
          className="w-5 h-5 accent-yellow-500 mt-0.5 shrink-0"
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Use my linked player automatically</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Widget follows whatever player tag you have saved in Profile.
          </p>
        </div>
      </label>

      {/* Fixed-tag input (hidden when following linked) */}
      {!useLinked && (
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Player tag</label>
          <HashInput
            value={tagInput}
            onChange={setTagInput}
            placeholder="ABC123XYZ"
            inputClassName="glass-input"
          />
          {preview.status === "loading" && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Looking up player...</p>
          )}
          {preview.status === "error" && tagInput.trim() !== "" && (
            <p className="text-sm text-red-400 mt-1">{preview.message}</p>
          )}
          {preview.status === "success" && (
            <div className="mt-2">
              <PlayerPreviewCard player={preview.data} />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border hover:border-gray-500 text-sm font-semibold py-2.5 rounded-lg transition"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
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

interface PreviewPlayer {
  name: string;
  tag: string;
  townHallLevel: number;
  trophies: number;
  league?: { iconUrls?: { small?: string }; name?: string };
  leagueTier?: { iconUrls?: { small?: string }; name?: string };
  clan?: { name: string };
}

function PlayerPreviewCard({ player }: { player: PreviewPlayer }) {
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
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          TH{player.townHallLevel} · {player.trophies.toLocaleString()} 🏆
          {player.clan && <> · {player.clan.name}</>}
        </p>
      </div>
    </div>
  );
}
