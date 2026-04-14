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
    <div className="relative h-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
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
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {player.league?.iconUrls?.medium ? (
          <div className="relative w-12 h-12 shrink-0">
            <Image src={player.league.iconUrls.medium} alt={player.league.name} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="w-12 h-12 shrink-0 bg-gray-800 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white truncate">{player.name}</p>
          <p className="text-xs text-gray-500 font-mono">{player.tag}</p>
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
        <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
          {player.clan.badgeUrls?.small && (
            <div className="relative w-6 h-6 shrink-0">
              <Image src={player.clan.badgeUrls.small} alt={player.clan.name} fill className="object-contain" unoptimized />
            </div>
          )}
          <p className="text-xs text-gray-300 truncate">{player.clan.name}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800/60 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-yellow-400">{value}</p>
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
    <div className="absolute top-0 left-0 right-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-3 py-1.5 flex items-center justify-between z-10">
      <span className="widget-drag-handle cursor-move text-xs text-gray-400 font-semibold select-none">
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