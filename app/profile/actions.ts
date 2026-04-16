"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------- helpers ----------

function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-Z]{4,12}$/.test(trimmed)) return null;
  return `#${trimmed}`;
}

async function verifyClanTag(tag: string): Promise<boolean> {
  // Hit our own /api/clan route which proxies to CoC and validates
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  try {
    const res = await fetch(`${origin}/api/clan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clanTag: tag }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifyPlayerTag(tag: string): Promise<{ ok: boolean; clanTag?: string | null }> {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  try {
    const res = await fetch(`${origin}/api/player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerTag: tag }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, clanTag: data.clan?.tag ?? null };
  } catch {
    return { ok: false };
  }
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// ---------- actions ----------

export async function savePlayerTag(formData: FormData) {
  const { supabase, user } = await getUser();
  const raw = (formData.get("playerTag") as string ?? "").trim();

  if (raw === "") {
    await supabase.from("profiles").update({ linked_player_tag: null, updated_at: new Date().toISOString() }).eq("id", user.id);
    revalidatePath("/profile");
    return { success: true, suggestedClanTag: null };
  }

  const tag = normalizeTag(raw);
  if (!tag) return { error: "Invalid tag format. Player tags are 4–12 characters, letters and numbers only." };

  const verify = await verifyPlayerTag(tag);
  if (!verify.ok) return { error: "Player not found. Double-check the tag." };

  await supabase.from("profiles").update({
    linked_player_tag: tag,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true, suggestedClanTag: verify.clanTag };
}

export async function saveMainClan(formData: FormData) {
  const { supabase, user } = await getUser();
  const raw = (formData.get("clanTag") as string ?? "").trim();

  if (raw === "") {
    await supabase.from("profiles").update({ main_clan_tag: null, updated_at: new Date().toISOString() }).eq("id", user.id);
    revalidatePath("/profile");
    return { success: true };
  }

  const tag = normalizeTag(raw);
  if (!tag) return { error: "Invalid clan tag format." };

  const ok = await verifyClanTag(tag);
  if (!ok) return { error: "Clan not found. Double-check the tag." };

  // Make sure it's not already in clans_of_interest
  const { data: profile } = await supabase
    .from("profiles")
    .select("clans_of_interest")
    .eq("id", user.id)
    .single();

  const interests = (profile?.clans_of_interest as string[] | null) ?? [];
  const cleanedInterests = interests.filter((t) => t !== tag);

  await supabase.from("profiles").update({
    main_clan_tag: tag,
    clans_of_interest: cleanedInterests,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}

export async function addClanOfInterest(formData: FormData) {
  const { supabase, user } = await getUser();
  const raw = (formData.get("clanTag") as string ?? "").trim();

  const tag = normalizeTag(raw);
  if (!tag) return { error: "Invalid clan tag format." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("main_clan_tag, clans_of_interest")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found." };

  const interests = (profile.clans_of_interest as string[] | null) ?? [];

  if (tag === profile.main_clan_tag) return { error: "This clan is already your main clan." };
  if (interests.includes(tag)) return { error: "Already in your clans of interest." };
  if (interests.length >= 10) return { error: "You're at the 10-clan limit. Remove one first." };

  const ok = await verifyClanTag(tag);
  if (!ok) return { error: "Clan not found. Double-check the tag." };

  await supabase.from("profiles").update({
    clans_of_interest: [...interests, tag],
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}

export async function removeClanOfInterest(tag: string) {
  const { supabase, user } = await getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("clans_of_interest")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found." };

  const interests = (profile.clans_of_interest as string[] | null) ?? [];
  const updated = interests.filter((t) => t !== tag);

  await supabase.from("profiles").update({
    clans_of_interest: updated,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}

export async function promoteClanOfInterestToMain(tag: string) {
  const { supabase, user } = await getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("main_clan_tag, clans_of_interest")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found." };

  const interests = (profile.clans_of_interest as string[] | null) ?? [];
  if (!interests.includes(tag)) return { error: "That clan is not in your clans of interest." };

  // Swap: promoted tag becomes main; current main (if any) goes to front of interests
  const withoutPromoted = interests.filter((t) => t !== tag);
  const newInterests = profile.main_clan_tag
    ? [profile.main_clan_tag, ...withoutPromoted]
    : withoutPromoted;

  await supabase.from("profiles").update({
    main_clan_tag: tag,
    clans_of_interest: newInterests,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}

export async function saveSelectedCountries(codes: string[]) {
  const { supabase, user } = await getUser();

  if (codes.length > 10) return { error: "Maximum 10 countries allowed." };

  await supabase.from("profiles").update({
    selected_countries: codes,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}

export async function demoteMainClanToInterest() {
  const { supabase, user } = await getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("main_clan_tag, clans_of_interest")
    .eq("id", user.id)
    .single();

  if (!profile?.main_clan_tag) return { error: "No main clan to demote." };

  const interests = (profile.clans_of_interest as string[] | null) ?? [];
  if (interests.length >= 10) {
    return { error: "Your clans of interest are full. Remove one first, or use 'Remove' to fully drop the main clan." };
  }

  await supabase.from("profiles").update({
    main_clan_tag: null,
    clans_of_interest: [profile.main_clan_tag, ...interests],
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true };
}