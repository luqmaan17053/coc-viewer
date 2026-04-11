"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveLinkedTag(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rawTag = (formData.get("playerTag") as string ?? "").trim();

  // Validation: empty allowed (clears the link), otherwise must look like a CoC tag
  let cleanTag: string | null = null;
  if (rawTag.length > 0) {
    // Strip leading # if present, uppercase, validate format
    const stripped = rawTag.replace(/^#/, "").toUpperCase();
    if (!/^[0-9A-Z]{4,12}$/.test(stripped)) {
      return { error: "Invalid tag format. CoC tags are 4-12 characters, letters and numbers only." };
    }
    cleanTag = `#${stripped}`;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      linked_player_tag: cleanTag,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}