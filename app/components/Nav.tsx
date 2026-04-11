import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-gray-950 border-b border-gray-900 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-yellow-400 font-bold">⚔️ CoC Viewer</Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-yellow-400 transition">Dashboard</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-gray-400 hover:text-yellow-400 transition">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-gray-300 hover:text-yellow-400 transition">Log in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}