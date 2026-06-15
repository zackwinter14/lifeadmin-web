import { NextResponse } from "next/server";

const APP_ID = "6762589970";
const ITUNES_URL = `https://itunes.apple.com/lookup?id=${APP_ID}&country=us`;

// Revalidate once per hour
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(ITUNES_URL, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Life Admin Website" },
    });

    if (!res.ok) throw new Error(`iTunes API returned ${res.status}`);

    const data = await res.json();
    const app = data?.results?.[0];

    if (!app) throw new Error("No app found in iTunes response");

    const rating: number = app.averageUserRating ?? 0;
    const count: number = app.userRatingCount ?? 0;

    return NextResponse.json({
      rating: Math.round(rating * 10) / 10,     // e.g. 4.8
      count,                                      // e.g. 312
      version: app.version ?? "",
      releaseDate: app.releaseDate ?? "",
    });
  } catch (err) {
    // Return safe fallback so the site never breaks
    return NextResponse.json(
      { rating: null, count: null, version: null, releaseDate: null, error: String(err) },
      { status: 200 }
    );
  }
}
