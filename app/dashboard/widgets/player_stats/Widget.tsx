"use client";

import Image from "next/image";
import { useLinkedPlayer, usePlayer } from "../../hooks";
import type { WidgetProps } from "../types";

export interface PlayerStatsConfig {
  /** If `useLinkedPlayer` is true, playerTag is ignored and the user's linked player is used. */
  useLinkedPlayer: boolean;
  /** Used only when useLinkedPlayer is false. */
  playerTag: string | null;
}

export default function PlayerStatsWidget({
  config,
  editMode,
  onRemove,
  onOpenConfig,
}: WidgetProps<PlayerStatsConfig>) {
  const follow = config.useLinkedPlayer;
  const linkedQuery = useLinkedPlayer();
  const fixedQuery = usePlayer(follow ? null : config.playerTag);

  const query = follow ? linkedQuery : fixedQuery;
  const { data: player, isLoading, error } = query;

  const noConfigYet = !follow && !config.playerTag;

  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden flex flex-col backdrop-blur-md"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-glass)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      {editMode && (
        <WidgetChrome title="Player Stats" onRemove={onRemove} onOpenConfig={onOpenConfig} />
      )}

      <div className="flex-1 p-4 overflow-auto">
        {noConfigYet && <UnconfiguredState editMode={editMode} onOpenConfig={onOpenConfig} />}
        {!noConfigYet && isLoading && <LoadingState />}
        {!noConfigYet && error && <ErrorState message={(error as Error).message} />}
        {!noConfigYet && !isLoading && !error && !player && <EmptyLinkedState follow={follow} />}
        {!noConfigYet && player && <PlayerContent player={player} />}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

function EmptyLinkedState({ follow }: { follow: boolean }) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <p className="text-sm text-gray-500">
        {follow ? (
          <>Set your player tag in <span className="text-yellow-400">Profile</span> to see your stats.</>
        ) : (
          <>Player not found.</>
        )}
      </p>
    </div>
  );
}

function UnconfiguredState({ editMode, onOpenConfig }: { editMode: boolean; onOpenConfig: () => void }) {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <div>
        <p className="text-sm text-gray-500 mb-2">No player set.</p>
        {editMode && (
          <button
            type="button"
            onClick={onOpenConfig}
            className="text-xs text-yellow-400 hover:underline"
          >
            Click ⚙ to configure
          </button>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlayerContent({ player }: { player: any }) {
  // New API uses leagueTier; old API uses league. Prefer leagueTier.
  const leagueIconUrl = player.leagueTier?.iconUrls?.small ?? player.league?.iconUrls?.medium ?? null;
  const leagueName = player.leagueTier?.name ?? player.league?.name ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {leagueIconUrl ? (
          <div className="relative w-12 h-12 shrink-0">
            <Image src={leagueIconUrl} alt={leagueName ?? "League"} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="w-12 h-12 shrink-0 bg-gray-800 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>{player.name}</p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{player.tag}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Town Hall" value={`TH${player.townHallLevel}`} />
        <Stat label="XP Level" value={player.expLevel} />
        <Stat label="Trophies" value={player.trophies.toLocaleString()} />
        <Stat label="Best" value={player.bestTrophies?.toLocaleString() ?? "—"} />
        <Stat label="War Stars" value={player.warStars?.toLocaleString() ?? "—"} />
        <Stat label="Donations" value={player.donations?.toLocaleString() ?? "0"} />
      </div>

      {player.clan && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}
        >
          {player.clan.badgeUrls?.small && (
            <div className="relative w-6 h-6 shrink-0">
              <Image src={player.clan.badgeUrls.small} alt={player.clan.name} fill className="object-contain" unoptimized />
            </div>
          )}
          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{player.clan.name}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "var(--bg-surface-subtle)", border: "1px solid var(--border-subtle)" }}
    >
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "var(--accent-text)" }}>{value}</p>
    </div>
  );
}

function WidgetChrome({
  title,
  onRemove,
  onOpenConfig,
}: {
  title: string;
  onRemove: () => void;
  onOpenConfig: () => void;
}) {
  return (
    <div
      className="absolute top-0 left-0 right-0 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between z-10"
      style={{ background: "var(--bg-surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span className="widget-drag-handle cursor-move text-xs font-semibold select-none" style={{ color: "var(--text-secondary)" }}>
        ⠿ {title}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenConfig}
          className="text-gray-400 hover:text-yellow-400 w-6 h-6 flex items-center justify-center transition text-sm"
          title="Configure"
        >
          ⚙
        </button>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-400 w-6 h-6 flex items-center justify-center transition text-sm"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Now that the clan section is always shown when the player has a clan,
// the showClan toggle is gone. Player-stats widget is simpler.