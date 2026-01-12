"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Shop = {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  lat: number;
  lng: number;
};

export default function ResultsClient() {
  const sp = useSearchParams();

  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const issue = sp.get("issue") || "mobile repair";

  const [radius, setRadius] = useState(3000);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const lastKeyRef = useRef("");

  useEffect(() => {
    async function load() {
      if (!lat || !lng) return;

      const key = `${lat}|${lng}|${radius}|${issue}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      setLoading(true);
      setErrorMsg("");

      try {
        const r = await fetch(
          `/api/shops?lat=${lat}&lng=${lng}&radius=${radius}&issue=${encodeURIComponent(issue)}`
        );

        const data = await r.json();

        if (!r.ok) {
          setShops([]);
          setErrorMsg(data?.error || "Failed to load shops");
        } else {
          setShops(data.results || []);
        }
      } catch {
        setShops([]);
        setErrorMsg("Network error while loading shops");
      }

      setLoading(false);
    }

    load();
  }, [lat, lng, issue, radius]);

  if (!lat || !lng) return <div className="p-6 text-slate-800">Location missing.</div>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-900">Repair shops near you</h2>
      <p className="mt-1 text-slate-600">Issue: {issue}</p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setRadius(3000)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-slate-900"
        >
          Search 3km
        </button>

        <button
          onClick={() => setRadius(10000)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white"
        >
          Expand to 10km
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-slate-700">Loading…</div>
      ) : errorMsg ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          {errorMsg}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {shops.map((s) => (
            <div key={s.placeId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900">{s.name}</div>

              <div className="mt-1 text-sm text-slate-600">
                {s.address || "Address not available"}
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {s.phone ? (
                  <a className="rounded-xl bg-green-600 px-4 py-2 text-white" href={`tel:${s.phone}`}>
                    Call
                  </a>
                ) : (
                  <span className="rounded-xl border border-slate-300 px-4 py-2 text-slate-500">
                    No phone
                  </span>
                )}

                <a
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-900"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                >
                  Directions
                </a>
              </div>
            </div>
          ))}

          {shops.length === 0 && (
            <div className="rounded-2xl border border-slate-200 p-4 text-slate-700">
              No shops found in this radius.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
