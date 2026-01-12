"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const popularServices = [
  "Phone screen repair",
  "Battery replacement",
  "Charging port issue",
  "Water damage",
  "Speaker / mic issue",
  "Camera issue",
  "Software / OS issue",
  "Phone unlocking",
  "Tablet repair",
  "Laptop repair",
];

export default function HomePage() {
  const router = useRouter();
  const [issue, setIssue] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [loading, setLoading] = useState(false);

  function continueWithGPS() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        router.push(
          `/results?lat=${lat}&lng=${lng}&issue=${encodeURIComponent(
            issue || "mobile repair"
          )}`
        );
      },
      () =>
        alert(
          "Location blocked. Please allow location or type your area/pincode."
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function continueWithManualLocation() {
    const q = manualLocation.trim();
    if (!q) {
      alert("Please type your area/pincode, or use GPS.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await r.json();

      if (!r.ok) {
        alert(data?.error || "Location search failed");
        setLoading(false);
        return;
      }

      router.push(
        `/results?lat=${data.lat}&lng=${data.lng}&issue=${encodeURIComponent(
          issue || "mobile repair"
        )}`
      );
    } catch {
      alert("Network error while searching location");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-bold tracking-tight text-slate-900">
            RepairFinder
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <input
              className="w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400"
              placeholder="Search for a service"
            />
            <button className="rounded-lg px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">
              Login
            </button>
            <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Join as a Professional
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="h-[520px] bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=1600&q=60)",
          }}
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4">
            <h1 className="max-w-4xl text-center text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Find mobile repair shops near you
            </h1>

            <div className="mt-8 w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
              <div className="text-sm font-semibold">What problem do you have?</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-500"
                placeholder="Example: screen broken, battery issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />

              <div className="mt-4 text-sm font-semibold">Where do you need it?</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-500"
                placeholder="Enter your area / pincode (or leave blank for GPS)"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
              />

              <button
                disabled={loading}
                onClick={() => {
                  if (manualLocation.trim()) continueWithManualLocation();
                  else continueWithGPS();
                }}
                className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {loading ? "Searching…" : "Continue"}
              </button>

              <p className="mt-3 text-xs text-slate-500">
                Tip: Type your area/pincode to avoid GPS permission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-4xl font-extrabold text-slate-900">
          Need help fixing your phone?
        </h2>

        <p className="mt-4 max-w-3xl text-slate-700">
          Describe the problem and see nearby repair options. Compare distance and
          contact details, then choose the shop that works best for you.
        </p>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Find a repair shop today
        </button>
      </section>

      {/* Popular services */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h3 className="text-2xl font-bold text-slate-900">Popular services</h3>

        <div className="mt-6 flex flex-wrap gap-3">
          {popularServices.map((s) => (
            <button
              key={s}
              onClick={() => {
                setIssue(s);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-blue-700 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-3">
          <div>
            <div className="font-semibold text-slate-900">For Customers</div>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>Find a shop</li>
              <li>How it works</li>
              <li>Support</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-slate-900">For Shops</div>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>Join as a shop</li>
              <li>How leads work</li>
              <li>Pricing (later)</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-slate-900">Need help?</div>
            <button className="mt-3 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">
              Contact us
            </button>
            <p className="mt-4 text-sm text-slate-500">
              © {new Date().getFullYear()} RepairFinder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
