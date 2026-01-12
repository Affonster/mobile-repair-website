import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return Response.json({ error: "q is required" }, { status: 400 });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  // Docs mention providing an email address for heavy usage. [web:372]
  url.searchParams.set("email", "your-email@example.com");

  const r = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      // Policy: must identify your application; stock UA may get blocked. [web:171]
      "User-Agent": "RepairFinderDemo/1.0 (your-email@example.com)",
      // Some deployments also work better with a referer set. [web:171]
      "Referer": "https://your-vercel-domain.vercel.app/",
    },
  });

  const text = await r.text();

  // Return exact info for debugging
  if (!r.ok) {
    return Response.json(
      {
        error: "Geocoding failed",
        status: r.status,
        details: text.slice(0, 300),
      },
      { status: 502 }
    );
  }

  let data: any[] = [];
  try {
    data = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Geocoding failed", status: r.status, details: "Non-JSON response" },
      { status: 502 }
    );
  }

  if (!data.length) return Response.json({ error: "No location found" }, { status: 404 });

  return Response.json({
    q,
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  });
}
