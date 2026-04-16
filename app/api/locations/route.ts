import { NextResponse } from "next/server";

const PROXY_URL = process.env.PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

export async function GET() {
  if (!PROXY_URL || !PROXY_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: proxy not set." },
      { status: 500 }
    );
  }

  const res = await fetch(`${PROXY_URL}/v1/locations`, {
    headers: {
      "x-proxy-secret": PROXY_SECRET,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch locations." },
      { status: res.status }
    );
  }

  const data = await res.json();
  const locations = (data.items ?? [])
    .filter((loc: { isCountry?: boolean }) => loc.isCountry)
    .map((loc: { id: number; name: string; countryCode: string }) => ({
      id: loc.id,
      name: loc.name,
      countryCode: loc.countryCode,
    }));

  return NextResponse.json({ locations });
}
