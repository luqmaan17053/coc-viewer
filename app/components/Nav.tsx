import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeToggleConditional from "./ThemeToggleConditional";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav
      className="border-b px-4 py-3 backdrop-blur-md sticky top-0 z-50"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--nav-border)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-yellow-400 font-bold">⚔️ CoC Viewer</Link>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggleConditional />
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-yellow-400 transition" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="hover:text-yellow-400 transition" style={{ color: "var(--text-secondary)" }}>Log in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
