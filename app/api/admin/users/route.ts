import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, linked_player_tag, is_admin")
    .eq("is_admin", true)
    .order("display_name", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "userId must be a UUID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId")?.trim() ?? "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "userId must be a UUID" }, { status: 400 });
  }
  if (userId === admin.userId) {
    return NextResponse.json({ error: "Cannot revoke your own admin access" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: false })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
