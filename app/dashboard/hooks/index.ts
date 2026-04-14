export { useProfile } from "./useProfile";
export { usePlayer } from "./usePlayer";
export { useClan } from "./useClan";
export { useClanRef, type ClanRef } from "./useClanRef";

// Convenience hooks
import { useProfile } from "./useProfile";
import { usePlayer } from "./usePlayer";
import { useClan } from "./useClan";

export function useLinkedPlayer() {
  const profile = useProfile();
  return usePlayer(profile.data?.linked_player_tag ?? null);
}

export function useMainClan() {
  const profile = useProfile();
  return useClan(profile.data?.main_clan_tag ?? null);
}