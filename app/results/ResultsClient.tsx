"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Shop = {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
};

function formatDistance(m?: number) {
  if (typeof m !== "number") return "";
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function ResultsClient() {
  const sp = useSearchParams();
  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const issue = sp.get("issue") || "mobile repair";

  const [radius, setRadius] = useState(3000);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // optional lead capture
  const [name, setName] = useState("");
  const [contact, setContact] = useState(""); // phone or email
  const [consent, setConsent] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const lastKeyRef = useRef("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!sessionIdRef.current) sessionIdRef.current = newSessionId();
  }, []);

  const canSaveLead = useMemo(() => {
    if (!consent) return false;
    if (name.trim().length < 2) return false;
    if (contact.trim().length < 6) return false;
    return true;
  }, [name, contact, consent]);

  async function logEvent(payload: any) {
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore: tracking should never block UX
    }
  }

  async function saveLead() {
    if (!canSaveLead) return;
    setSavingLead(true);

    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          name: name.trim(),
          contact: contact.trim(),
          issue,
          lat: Number(lat),
          lng: Number(lng),
          consentFollowUp: true,
        }),
      });
      const raw = await r.text();
      const data = raw ? JSON.parse(raw) : null;

      if (r.ok && data?.leadId) setLeadId(data.leadId);
    } finally {
      setSavingLead(false);
    }
  }

  useEffect(() => {
    async function load() {
      if (!lat || !lng) return;

      const key = `${lat}|${lng}|${radius}|${issue}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      setLoading(true);
      setErrorMsg("");

      // log search event (no personal data)
      logEvent({
        type: "search",
        sessionId: sessionIdRef.current,
        leadId,
        issue,
        lat: Number(lat),
        lng: Number(lng),
        radius,
      });

      try {
        const r = await fetch(
          `/api/shops?lat=${lat}&lng=${lng}&radius=${radius}&issue=${encodeURIComponent(issue)}`,
          { cache: "no-store" }
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
  }, [lat, lng, issue, radius, leadId]);

  if (!lat || !lng) return <div className="p-6 text-slate-800">Location missing.</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="mx-auto max-w-5xl px-4 py-10 text-white">
          <div className="text-sm/6 opacity-90">RepairFinder</div>
          <h2 className="mt-1 text-3xl font-extrabold">Repair shops near you</h2>
          <p className="mt-2 max-w-3xl text-white/90">Issue: {issue}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setRadius(3000)}
              className={[
                "rounded-xl px-4 py-2 font-semibold",
                radius === 3000 ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/20",
              ].join(" ")}
            >
              Search 3 km
            </button>

            <button
              onClick={() => setRadius(10000)}
              className={[
                "rounded-xl px-4 py-2 font-semibold",
                radius === 10000 ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/20",
              ].join(" ")}
            >
              Expand to 10 km
            </button>

            <a className="rounded-xl bg-emerald-300 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-200" href="/">
              New search
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {/* Optional follow-up card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-lg font-bold text-slate-900">Want an update from us?</div>
              <p className="mt-1 text-sm text-slate-600">
                Optional. Share your contact so the team can follow up about your repair status.
              </p>
            </div>

            {leadId ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Saved for follow-up
              </span>
            ) : (
              <button
                onClick={saveLead}
                disabled={!canSaveLead || savingLead}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {savingLead ? "Saving…" : "Save my details"}
              </button>
            )}
          </div>

          {!leadId && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-800">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">Phone or Email</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                  placeholder="Example: 9876543210 or you@mail.com"
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                Save my contact details so RepairFinder can follow up about this repair.
              </label>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            Loading…
          </div>
        ) : errorMsg ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {errorMsg}
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {shops.map((s) => (
              <div
                key={s.placeId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="truncate font-semibold text-slate-900">{s.name}</div>
                      {s.distanceMeters != null && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {formatDistance(s.distanceMeters)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {s.address || "Address not available"}
                    </div>

                    <div className="mt-2 text-sm text-slate-700">
                      Phone: <span className="font-semibold">{s.phone || "Not listed"}</span>
                    </div>
                  </div>

                  <a
                    className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-50"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logEvent({
                        type: "shop_action",
                        action: "directions_click",
                        sessionId: sessionIdRef.current,
                        leadId,
                        shopId: s.placeId,
                        shopName: s.name,
                      })
                    }
                    href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                  >
                    Directions
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {s.phone ? (
                    <a
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                      onClick={() =>
                        logEvent({
                          type: "shop_action",
                          action: "call_click",
                          sessionId: sessionIdRef.current,
                          leadId,
                          shopId: s.placeId,
                          shopName: s.name,
                        })
                      }
                      href={`tel:${s.phone}`}
                    >
                      Call
                    </a>
                  ) : (
                    <span className="rounded-xl border border-slate-300 px-4 py-2 text-slate-500">
                      No phone
                    </span>
                  )}
                </div>
              </div>
            ))}

            {shops.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700">
                No shops found in this radius.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
