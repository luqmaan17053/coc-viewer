import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Use the public-facing host from headers, not request.url (which is the container's internal addr)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = forwardedHost ?? new URL(request.url).host;

  return NextResponse.redirect(`${forwardedProto}://${host}/`, { status: 302 });
}