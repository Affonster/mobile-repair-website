import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Haversine distance in meters. [web:424]
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function looksPhoneRelated(name: string) {
  const n = name.toLowerCase();

  const goodWords = [
    "mobile",
    "phone",
    "cell",
    "iphone",
    "samsung",
    "mi",
    "redmi",
    "oppo",
    "vivo",
    "realme",
    "oneplus",
    "service",
    "care",
    "repair",
  ];

  const badWords = [
    "borewell",
    "pump",
    "weld",
    "welding",
    "fabrication",
    "steel",
    "hardware",
    "tiles",
    "plywood",
    "cement",
    "car",
    "bike",
    "tyre",
  ];

  const good = goodWords.some((w) => n.includes(w));
  const bad = badWords.some((w) => n.includes(w));
  return good && !bad;
}

export async function GET(req: NextRequest) {
  const latStr = req.nextUrl.searchParams.get("lat");
  const lngStr = req.nextUrl.searchParams.get("lng");
  const radiusStr = req.nextUrl.searchParams.get("radius") || "3000";

  if (!latStr || !lngStr) {
    return Response.json({ results: [], error: "lat and lng required" }, { status: 400 });
  }

  const userLat = Number(latStr);
  const userLng = Number(lngStr);
  let radius = Number(radiusStr);

  if (Number.isNaN(userLat) || Number.isNaN(userLng) || Number.isNaN(radius)) {
    return Response.json({ results: [], error: "lat/lng/radius must be numbers" }, { status: 400 });
  }

  radius = clamp(radius, 500, 12000);

  // Simple, stable Overpass query. [web:164]
  const query = `
[out:json][timeout:25];
(
  nwr(around:${radius},${userLat},${userLng})["shop"="mobile_phone"];
  nwr(around:${radius},${userLat},${userLng})["craft"="electronics_repair"];
);
out center;
`.trim();

  let lastDetails = "";

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const r = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ data: query }).toString(),
    });

    const text = await r.text();
    const ct = r.headers.get("content-type") || "";

    if (!r.ok) {
      lastDetails = `HTTP ${r.status}: ${text.slice(0, 200)}`;
      continue;
    }
    if (!ct.includes("application/json")) {
      lastDetails = `Non-JSON response: ${text.slice(0, 200)}`;
      continue;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      lastDetails = `JSON parse failed: ${text.slice(0, 200)}`;
      continue;
    }

    const all = (data.elements || [])
      .map((el: any) => {
        const coords =
          el.type === "node"
            ? { lat: el.lat, lng: el.lon }
            : { lat: el.center?.lat, lng: el.center?.lon };

        const tags = el.tags || {};
        const name = tags.name || "Unnamed shop";

        const d = distanceMeters(userLat, userLng, coords.lat, coords.lng);

        return {
          placeId: `${el.type}-${el.id}`,
          name,
          address: tags["addr:full"] || tags["addr:street"] || "",
          phone: tags["contact:phone"] || tags.phone || "",
          lat: coords.lat,
          lng: coords.lng,
          distanceMeters: Math.round(d),
        };
      })
      .filter((x: any) => x.lat && x.lng);

    // Filter out obvious wrong names + unnamed.
    const filtered = all.filter((x: any) => x.name !== "Unnamed shop" && looksPhoneRelated(x.name));

    // Sort nearest first.
    filtered.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

    return Response.json({ results: filtered });
  }

  return Response.json(
    { results: [], error: "Overpass busy. Try again later.", details: lastDetails },
    { status: 502 }
  );
}
