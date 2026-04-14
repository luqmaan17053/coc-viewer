"use client";

import { useClan } from "./useClan";
import { useProfile } from "./useProfile";

export type ClanRef =
  | { kind: "main" }
  | { kind: "interest"; tag: string }
  | { kind: "local"; tag: string };

export function useClanRef(ref: ClanRef) {
  const profile = useProfile();

  let tag: string | null = null;
  let resolved = false;
  let isOrphaned = false;

  if (profile.data) {
    resolved = true;
    if (ref.kind === "main") {
      tag = profile.data.main_clan_tag;
    } else if (ref.kind === "interest") {
      const interests = profile.data.clans_of_interest ?? [];
      if (interests.includes(ref.tag)) {
        tag = ref.tag;
      } else {
        isOrphaned = true;
      }
    } else {
      tag = ref.tag;
    }
  }

  const clan = useClan(tag);

  return {
    ...clan,
    resolved,
    isOrphaned,
    tag,
  };
}