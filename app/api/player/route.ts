import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token, playerTag } = await req.json();

  if (!token || !playerTag) {
    return NextResponse.json(
      { error: "API token and player tag are required." },
      { status: 400 }
    );
  }

  // Encode # as %23 for the URL
  const encodedTag = encodeURIComponent(playerTag.startsWith("#") ? playerTag : `#${playerTag}`);

  const res = await fetch(`https://api.clashofclans.com/v1/players/${encodedTag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
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
