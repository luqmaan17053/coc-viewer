import Image from "next/image";

interface Troop {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
}

interface PlayerData {
  name: string;
  tag: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  donations: number;
  donationsReceived: number;
  builderHallLevel?: number;
  builderBaseTrophies?: number;
  clan?: {
    name: string;
    tag: string;
    badgeUrls: { small: string; medium: string; large: string };
    clanLevel: number;
  };
  role?: string;
  league?: {
    name: string;
    iconUrls: { small: string; tiny: string; medium: string };
  };
  leagueTier?: {
    name: string;
    iconUrls: { small: string; large: string };
  };
  troops?: Troop[];
  heroes?: Troop[];
  spells?: Troop[];
  labels?: { name: string; iconUrls: { small: string; medium: string } }[];
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-yellow-400">{value}</p>
    </div>
  );
}

function LevelBar({ level, maxLevel }: { level: number; maxLevel: number }) {
  const pct = Math.round((level / maxLevel) * 100);
  const isMax = level === maxLevel;
  return (
    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full ${isMax ? "bg-yellow-400" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TroopGrid({ items, title }: { items: Troop[]; title: string }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {items.map((t) => (
          <div
            key={`${t.name}-${t.village}`}
            className="bg-gray-800 rounded-lg px-3 py-2"
          >
            <p className="text-xs text-gray-300 truncate">{t.name}</p>
            <p className="text-sm font-bold text-white">
              {t.level}
              <span className="text-gray-500 font-normal text-xs">/{t.maxLevel}</span>
            </p>
            <LevelBar level={t.level} maxLevel={t.maxLevel} />
          </div>
        ))}
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  member: "Member",
  admin: "Elder",
  coLeader: "Co-Leader",
  leader: "Leader",
};

export default function PlayerCard({ player }: { player: PlayerData }) {
  const homeVillageTroops = player.troops?.filter((t) => t.village === "home") ?? [];
  const builderTroops = player.troops?.filter((t) => t.village === "builderBase") ?? [];
  const homeHeroes = player.heroes?.filter((h) => h.village === "home") ?? [];
  const builderHeroes = player.heroes?.filter((h) => h.village === "builderBase") ?? [];
  const homeSpells = player.spells?.filter((s) => s.village === "home") ?? [];

  // New API uses leagueTier; old API uses league. Prefer leagueTier.
  const effectiveLeague = player.leagueTier
    ? { name: player.leagueTier.name, iconUrl: player.leagueTier.iconUrls.small }
    : player.league?.iconUrls?.medium
    ? { name: player.league.name, iconUrl: player.league.iconUrls.medium }
    : null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* League icon */}
          {effectiveLeague && (
            <div className="relative w-16 h-16 shrink-0">
              <Image
                src={effectiveLeague.iconUrl}
                alt={effectiveLeague.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{player.name}</h2>
              <span className="text-xs text-gray-500 font-mono">{player.tag}</span>
            </div>
            <p className="text-sm text-gray-400">
              Town Hall <span className="text-yellow-400 font-bold">{player.townHallLevel}</span>
              {" · "}Exp Level <span className="text-yellow-400 font-bold">{player.expLevel}</span>
              {effectiveLeague && (
                <>
                  {" · "}
                  <span className="text-blue-400">{effectiveLeague.name}</span>
                </>
              )}
            </p>

            {/* Labels */}
            {player.labels && player.labels.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {player.labels.map((label) => (
                  <div key={label.name} className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-1">
                    <div className="relative w-4 h-4">
                      <Image
                        src={label.iconUrls.small}
                        alt={label.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-gray-300">{label.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clan */}
          {player.clan && (
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 shrink-0">
              <div className="relative w-10 h-10">
                <Image
                  src={player.clan.badgeUrls.small}
                  alt={player.clan.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{player.clan.name}</p>
                <p className="text-xs text-gray-400">
                  Level {player.clan.clanLevel}
                  {player.role && (
                    <> · {ROLE_LABELS[player.role] ?? player.role}</>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <StatBox label="Trophies" value={player.trophies} />
          <StatBox label="Best Trophies" value={player.bestTrophies} />
          <StatBox label="War Stars" value={player.warStars} />
          <StatBox label="Attack Wins" value={player.attackWins} />
          <StatBox label="Defense Wins" value={player.defenseWins} />
          <StatBox label="Donations" value={player.donations} />
          <StatBox label="Donations Rec." value={player.donationsReceived} />
          {player.builderHallLevel && (
            <StatBox label="Builder Hall" value={player.builderHallLevel} />
          )}
          {player.builderBaseTrophies != null && (
            <StatBox label="Builder Trophies" value={player.builderBaseTrophies} />
          )}
        </div>
      </div>

      {/* Heroes */}
      {(homeHeroes.length > 0 || builderHeroes.length > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Heroes</h3>
          {homeHeroes.length > 0 && <TroopGrid items={homeHeroes} title="Home Village" />}
          {builderHeroes.length > 0 && <TroopGrid items={builderHeroes} title="Builder Base" />}
        </div>
      )}

      {/* Troops */}
      {(homeVillageTroops.length > 0 || builderTroops.length > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Troops</h3>
          {homeVillageTroops.length > 0 && <TroopGrid items={homeVillageTroops} title="Home Village" />}
          {builderTroops.length > 0 && <TroopGrid items={builderTroops} title="Builder Base" />}
        </div>
      )}

      {/* Spells */}
      {homeSpells.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Spells</h3>
          <TroopGrid items={homeSpells} title="" />
        </div>
      )}
    </div>
  );
}
