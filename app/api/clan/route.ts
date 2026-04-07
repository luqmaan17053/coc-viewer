import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token, clanTag } = await req.json();

  if (!token || !clanTag) {
    return NextResponse.json(
      { error: "API token and clan tag are required." },
      { status: 400 }
    );
  }

  const encodedTag = encodeURIComponent(clanTag.startsWith("#") ? clanTag : `#${clanTag}`);

  const res = await fetch(`https://api.clashofclans.com/v1/clans/${encodedTag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message || "Failed to fetch clan data." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
