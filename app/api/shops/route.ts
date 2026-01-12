import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function looksPhoneRelated(name: string) {
  const n = name.toLowerCase();

  // Words/brands that usually mean phone/mobile repair
  const goodWords = [
    "mobile",
    "phone",
    "cell",
    "smart",
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

  // Words that clearly mean NOT phone repair
  const badWords = [
    "borewell",
    "pump",
    "weld",
    "welding",
    "fabrication",
    "steel",
    "hardware",
    "cement",
    "tiles",
    "plywood",
    "furniture",
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

  const lat = Number(latStr);
  const lng = Number(lngStr);
  let radius = Number(radiusStr);

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
    return Response.json({ results: [], error: "lat/lng/radius must be numbers" }, { status: 400 });
  }

  radius = clamp(radius, 500, 12000);

  // Simple Overpass query (stable). [web:246]
  // craft=electronics_repair is generic, so we'll filter names in JS. [web:276]
  const query = `
[out:json][timeout:25];
(
  nwr(around:${radius},${lat},${lng})["shop"="mobile_phone"];
  nwr(around:${radius},${lat},${lng})["craft"="electronics_repair"];
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

        return {
          placeId: `${el.type}-${el.id}`,
          name,
          address: tags["addr:full"] || tags["addr:street"] || "",
          phone: tags["contact:phone"] || tags.phone || "",
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((x: any) => x.lat && x.lng);

    // Strong filter: only keep phone-related names, and drop "Unnamed shop"
    const results = all.filter((x: any) => x.name !== "Unnamed shop" && looksPhoneRelated(x.name));

    return Response.json({ results });
  }

  return Response.json(
    { results: [], error: "Overpass busy. Try again later.", details: lastDetails },
    { status: 502 }
  );
}
