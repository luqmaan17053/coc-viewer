import { createClient } from "@/lib/supabase/server";

export type AdminContext = {
  userId: string;
  email: string | null;
};

/**
 * Returns the current user if they are an admin, otherwise null.
 * Use in server components/route handlers — never trust client claims.
 */
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return { userId: user.id, email: user.email ?? null };
}
