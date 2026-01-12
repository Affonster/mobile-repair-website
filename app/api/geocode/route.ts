import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return Response.json({ error: "q is required" }, { status: 400 });

  // Nominatim Search API: use format=json and limit results. [web:372]
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  // Nominatim policy: identify your application via User-Agent. [web:171]
  const r = await fetch(url.toString(), {
    headers: {
      "User-Agent": "mobile-repair-website-demo (contact: your-email@example.com)",
    },
  });

  if (!r.ok) {
    const text = await r.text();
    return Response.json(
      { error: "Geocoding failed", details: text.slice(0, 200) },
      { status: 502 }
    );
  }

  const data: any[] = await r.json();
  if (!data.length) return Response.json({ error: "No location found" }, { status: 404 });

  return Response.json({
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  });
}
