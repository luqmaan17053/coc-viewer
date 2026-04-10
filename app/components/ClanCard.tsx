"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import PlayerCard from "./PlayerCard";

interface ClanMember {
  name: string;
  tag: string;
  role: string;
  expLevel: number;
  trophies: number;
  builderBaseTrophies: number;
  donations: number;
  donationsReceived: number;
  townHallLevel: number;
  league?: {
    name: string;
    iconUrls: { tiny: string; small: string; medium: string };
  };
}

interface ClanData {
  name: string;
  tag: string;
  type: string;
  description?: string;
  clanLevel: number;
  clanPoints: number;
  clanBuilderBasePoints: number;
  members: number;
  isWarLogPublic: boolean;
  warFrequency?: string;
  warWinStreak: number;
  warWins: number;
  warTies?: number;
  warLosses?: number;
  badgeUrls: { small: string; medium: string; large: string };
  requiredTrophies: number;
  requiredTownhallLevel?: number;
  location?: { name: string; isCountry: boolean; countryCode?: string };
  labels?: { name: string; iconUrls: { small: string; medium: string } }[];
  memberList?: ClanMember[];
}

const ROLE_LABELS: Record<string, string> = {
  member: "Member",
  admin: "Elder",
  coLeader: "Co-Leader",
  leader: "Leader",
};

const ROLE_ORDER: Record<string, number> = {
  leader: 0,
  coLeader: 1,
  admin: 2,
  member: 3,
};

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-yellow-400">{value}</p>
    </div>
  );
}

function PlayerModal({ member, onClose }: { member: ClanMember; onClose: () => void }) {  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerTag: member.tag }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPlayerData(d);
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-8 bg-gray-950 border border-gray-800 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-white mb-5">
          {member.name}{" "}
          <span className="text-sm text-gray-500 font-mono font-normal">{member.tag}</span>
        </h2>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-5 py-4">
            {error}
          </div>
        )}

        {playerData && <PlayerCard player={playerData} />}
      </div>
    </div>
  );
}

export default function ClanCard({ clan }: { clan: ClanData }) {
  const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);

  const sorted = [...(clan.memberList ?? [])].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <Image src={clan.badgeUrls.medium} alt={clan.name} fill className="object-contain" unoptimized />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{clan.name}</h2>
              <span className="text-xs text-gray-500 font-mono">{clan.tag}</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize">
                {clan.type}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              Level <span className="text-yellow-400 font-bold">{clan.clanLevel}</span>
              {" · "}
              <span className="text-yellow-400 font-bold">{clan.members}</span>/50 members
              {clan.location && (
                <>
                  {" · "}
                  {clan.location.isCountry && clan.location.countryCode && (
                    <span className="mr-1">
                      {clan.location.countryCode
                        .toUpperCase()
                        .split("")
                        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
                        .join("")}
                    </span>
                  )}
                  {clan.location.name}
                </>
              )}
            </p>

            {clan.description && (
              <p className="text-sm text-gray-400 italic line-clamp-2">{clan.description}</p>
            )}

            {clan.labels && clan.labels.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {clan.labels.map((label) => (
                  <div key={label.name} className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-1">
                    <div className="relative w-4 h-4">
                      <Image src={label.iconUrls.small} alt={label.name} fill className="object-contain" unoptimized />
                    </div>
                    <span className="text-xs text-gray-300">{label.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Clan Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <StatBox label="Clan Points" value={clan.clanPoints.toLocaleString()} />
          <StatBox label="War Wins" value={clan.warWins} />
          <StatBox label="Win Streak" value={clan.warWinStreak} />
          {clan.warTies != null && <StatBox label="War Ties" value={clan.warTies} />}
          {clan.warLosses != null && <StatBox label="War Losses" value={clan.warLosses} />}
          <StatBox label="Req. Trophies" value={clan.requiredTrophies.toLocaleString()} />
          {clan.requiredTownhallLevel && (
            <StatBox label="Min. Town Hall" value={clan.requiredTownhallLevel} />
          )}
          {clan.warFrequency && (
            <StatBox label="War Frequency" value={clan.warFrequency.replace("_", " ")} />
          )}
        </div>
      </div>

      {/* Member List */}
      {sorted.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-base font-bold text-white">Members ({clan.members})</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click a member to view their full profile</p>
          </div>
          <div className="divide-y divide-gray-800">
            {sorted.map((m) => (
              <button
                key={m.tag}
                onClick={() => setSelectedMember(m)}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-800/60 transition text-left cursor-pointer"
              >
                {m.league?.iconUrls?.tiny ? (
                  <div className="relative w-8 h-8 shrink-0">
                    <Image src={m.league.iconUrls.tiny} alt={m.league.name} fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <div className="w-8 h-8 shrink-0 bg-gray-700 rounded-full" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{m.tag}</p>
                </div>

                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                    TH{m.townHallLevel}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-yellow-400">{m.trophies.toLocaleString()} 🏆</p>
                  <p className="text-xs text-gray-400">{ROLE_LABELS[m.role] ?? m.role}</p>
                </div>

                <span className="text-gray-600 text-sm shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Modal */}
        {selectedMember && (
        <PlayerModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
