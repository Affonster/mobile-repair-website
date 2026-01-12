"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = "Mobile" | "Tablet";
type Platform = "Android" | "iOS" | "Other";
type Brand =
  | "Apple"
  | "Samsung"
  | "OnePlus"
  | "Xiaomi"
  | "Oppo"
  | "Vivo"
  | "Realme"
  | "Other";

const issues = [
  "Screen broken",
  "Battery issue",
  "Charging problem",
  "Water damage",
  "Speaker/Mic issue",
  "Camera issue",
  "Software issue",
  "Other",
];

export default function HomePage() {
  const router = useRouter();

  // Modal open/close
  const [open, setOpen] = useState(false);

  // Steps: 0 category, 1 brand, 2 platform, 3 issue, 4 finding matches
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Answers
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandOther, setBrandOther] = useState("");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [issue, setIssue] = useState<string>("");

  const brandFinal = useMemo(() => {
    if (brand !== "Other") return brand || "";
    return brandOther.trim() || "Other";
  }, [brand, brandOther]);

  function resetWizard() {
    setStep(0);
    setCategory(null);
    setBrand(null);
    setBrandOther("");
    setPlatform(null);
    setIssue("");
  }

  function closeWizard() {
    setOpen(false);
  }

  function openWizard() {
    resetWizard();
    setOpen(true);
  }

  function back() {
    if (step === 0) return;
    setStep((step - 1) as any);
  }

  function canContinue() {
    if (step === 0) return !!category;
    if (step === 1) return !!brand && (brand !== "Other" || brandOther.trim().length >= 2);
    if (step === 2) return !!platform;
    if (step === 3) return !!issue;
    return false;
  }

  function next() {
    if (!canContinue()) return;
    setStep((step + 1) as any);
  }

  // Final submit: use GPS and go to results
  function findMatches() {
    setStep(4);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Build a useful issue string for searching
        const query = [
          category,
          brandFinal,
          platform,
          issue,
        ]
          .filter(Boolean)
          .join(" - ");

        // Small “found matches” delay (looks professional)
        setTimeout(() => {
          router.push(`/results?lat=${lat}&lng=${lng}&issue=${encodeURIComponent(query)}`);
        }, 900);
      },
      () => {
        alert("Please allow location permission (GPS) to find shops near you.");
        setStep(3); // go back to last step so user can try again
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
              <div className="text-sm font-semibold">Answer a few quick questions</div>
              <p className="mt-2 text-sm text-slate-600">
                This helps find the best matches near your location.
              </p>

              <button
                onClick={openWizard}
                className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600"
              >
                Continue
              </button>

              <p className="mt-3 text-xs text-slate-500">
                Location is used only to show nearby shops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Some content below (keep your existing sections if you want) */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-4xl font-extrabold text-slate-900">Popular issues</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {issues.map((s) => (
            <button
              key={s}
              onClick={() => {
                openWizard();
                setIssue(s);
                setStep(0);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-blue-700 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Modal wizard */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeWizard}
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">
                    Step {step + 1} of 5
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {step === 0 && "Is it a mobile or a tablet?"}
                    {step === 1 && "Which brand is it?"}
                    {step === 2 && "Which platform?"}
                    {step === 3 && "What issue are you facing?"}
                    {step === 4 && "We found your matches"}
                  </div>
                </div>

                <button
                  onClick={closeWizard}
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="mt-5">
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {(["Mobile", "Tablet"] as Category[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={[
                          "rounded-xl border px-4 py-3 text-left",
                          category === c
                            ? "border-blue-600 bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-900",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{c}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {c === "Mobile" ? "Phones" : "Tablets"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        "Apple",
                        "Samsung",
                        "OnePlus",
                        "Xiaomi",
                        "Oppo",
                        "Vivo",
                        "Realme",
                        "Other",
                      ] as Brand[]
                    ).map((b) => (
                      <button
                        key={b}
                        onClick={() => setBrand(b)}
                        className={[
                          "rounded-xl border px-4 py-3 text-left",
                          brand === b
                            ? "border-blue-600 bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-900",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{b}</div>
                      </button>
                    ))}

                    {brand === "Other" && (
                      <div className="col-span-2">
                        <label className="text-sm font-semibold text-slate-900">
                          Enter brand name
                        </label>
                        <input
                          value={brandOther}
                          onChange={(e) => setBrandOther(e.target.value)}
                          placeholder="Example: Nothing, Motorola..."
                          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-3 gap-3">
                    {(["Android", "iOS", "Other"] as Platform[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={[
                          "rounded-xl border px-4 py-3 text-left",
                          platform === p
                            ? "border-blue-600 bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-900",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{p}</div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    {issues.map((i) => (
                      <button
                        key={i}
                        onClick={() => setIssue(i)}
                        className={[
                          "rounded-xl border px-4 py-3 text-left",
                          issue === i
                            ? "border-blue-600 bg-blue-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-900",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{i}</div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm text-slate-700">
                      Looking for:
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {category} • {brandFinal} • {platform} • {issue}
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      Redirecting to results…
                    </div>
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={back}
                  disabled={step === 0 || step === 4}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-900 disabled:opacity-40"
                >
                  Back
                </button>

                {step < 3 && (
                  <button
                    onClick={next}
                    disabled={!canContinue()}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    Continue
                  </button>
                )}

                {step === 3 && (
                  <button
                    onClick={findMatches}
                    disabled={!canContinue()}
                    className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    Find matches
                  </button>
                )}

                {step === 4 && (
                  <button
                    onClick={closeWizard}
                    className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
                  >
                    Close
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Note: Manual postcode/town search is paused because the free public Nominatim geocoder blocked automated requests. [web:171]
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
