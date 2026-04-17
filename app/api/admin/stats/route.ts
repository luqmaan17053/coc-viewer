import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth/admin";

const PROXY_URL = process.env.PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!PROXY_URL || !PROXY_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: proxy not set." },
      { status: 500 }
    );
  }

  const search = req.nextUrl.searchParams;
  const series = search.get("series") ?? "5m";
  const lookback = search.get("lookback") ?? "1h";
  const endpoints = search.get("endpoints") ?? "24h";
  const limit = search.get("limit") ?? "10";

  const statsURL = `${PROXY_URL}/stats?series=${encodeURIComponent(series)}&lookback=${encodeURIComponent(lookback)}&endpoints=${encodeURIComponent(endpoints)}&limit=${encodeURIComponent(limit)}`;

  const [healthRes, statsRes] = await Promise.all([
    fetch(`${PROXY_URL}/health`, { cache: "no-store" }),
    fetch(statsURL, {
      headers: { "x-proxy-secret": PROXY_SECRET, accept: "application/json" },
      cache: "no-store",
    }),
  ]);

  const health = healthRes.ok ? await healthRes.json() : { error: `health ${healthRes.status}` };
  const stats = statsRes.ok ? await statsRes.json() : { error: `stats ${statsRes.status}` };

  return NextResponse.json({ health, stats }, {
    headers: { "Cache-Control": "no-store" },
  });
}
