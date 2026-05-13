import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const USER_AGENT =
  "NexiaaTrack/1.0 (internal geocoder; https://github.com/)";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 3) {
      return NextResponse.json([]);
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");

    const res = await fetch(url.toString(), {
      headers: {
        "Accept-Language": request.headers.get("Accept-Language") ?? "en",
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoder unavailable" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Geocode search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
