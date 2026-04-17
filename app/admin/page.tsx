import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/auth/admin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) notFound();

  return (
    <main className="min-h-screen py-8 px-4" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Admin</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Signed in as <span className="font-mono">{admin.email ?? admin.userId}</span>.
          </p>
        </div>
        <AdminClient currentUserId={admin.userId} />
      </div>
    </main>
  );
}
