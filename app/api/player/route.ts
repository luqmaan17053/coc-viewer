import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = process.env.PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

export async function POST(req: NextRequest) {
  if (!PROXY_URL || !PROXY_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: proxy not set." },
      { status: 500 }
    );
  }

  const { playerTag } = await req.json();

  if (!playerTag) {
    return NextResponse.json(
      { error: "Player tag is required." },
      { status: 400 }
    );
  }

  const encodedTag = encodeURIComponent(
    playerTag.startsWith("#") ? playerTag : `#${playerTag}`
  );

  const res = await fetch(`${PROXY_URL}/v1/players/${encodedTag}`, {
    headers: {
      "x-proxy-secret": PROXY_SECRET,
      accept: "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message || "Failed to fetch player data." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}