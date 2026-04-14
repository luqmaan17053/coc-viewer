"use client";

import Image from "next/image";
import { useState } from "react";
import type { WidgetConfigFormProps } from "../types";
import type { PlayerStatsConfig } from "./Widget";
import { usePlayerPreview } from "@/app/profile/useTagPreview";

export default function PlayerStatsConfigForm({
  initialConfig,
  onSave,
  onCancel,
}: WidgetConfigFormProps<PlayerStatsConfig>) {
    const [useLinked, setUseLinked] = useState(initialConfig.useLinkedPlayer ?? true);
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
          <p className="text-sm font-semibold text-white">Use my linked player automatically</p>
          <p className="text-xs text-gray-400">
            Widget follows whatever player tag you have saved in Profile.
          </p>
        </div>
      </label>

      {/* Fixed-tag input (hidden when following linked) */}
      {!useLinked && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Player tag</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="#ABC123XYZ"
            autoComplete="off"
            className="w-full min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition font-mono"
          />
          {preview.status === "loading" && (
            <p className="text-xs text-gray-500 mt-1">Looking up player...</p>
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

      <div className="flex gap-2 pt-2 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-semibold py-2.5 rounded-lg transition"
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
  league?: { iconUrls?: { small?: string } };
  clan?: { name: string };
}

function PlayerPreviewCard({ player }: { player: PreviewPlayer }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5">
      {player.league?.iconUrls?.small ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image src={player.league.iconUrls.small} alt="" fill className="object-contain" unoptimized />
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