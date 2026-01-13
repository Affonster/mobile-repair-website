import { sql } from "../../src/server/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const leads = await sql`
    SELECT id, name, contact, issue, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const events = await sql`
    SELECT id, session_id, lead_id, type, action, shop_place_id, shop_name, created_at
    FROM events
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const searches = await sql`
    SELECT session_id, created_at
    FROM events
    WHERE type = 'search' AND lead_id IS NULL
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin</h1>
        <p className="mt-1 text-slate-600">
          Leads (users who saved details) + events (shop actions) + anonymous searches.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Leads (last 50)</h2>
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Issue</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {leads.rows.map((l: any) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-semibold">{l.name}</td>
                      <td className="py-2 pr-4">{l.contact}</td>
                      <td className="py-2 pr-4">{l.issue}</td>
                      <td className="py-2 pr-4">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Events (last 100)</h2>
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Shop</th>
                    <th className="py-2 pr-4">Lead</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {events.rows.map((e: any) => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-semibold">{e.type}</td>
                      <td className="py-2 pr-4">{e.action || "—"}</td>
                      <td className="py-2 pr-4">
                        {e.shop_name || e.shop_place_id || "—"}
                      </td>
                      <td className="py-2 pr-4">{e.lead_id || "—"}</td>
                      <td className="py-2 pr-4">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Full-width section under both columns */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Anonymous searches (last 100)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  These are search events without saved user details (lead_id is null).
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                Count: {searches.rows.length}
              </div>
            </div>

            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {searches.rows.map((s: any, idx: number) => (
                    <tr key={`${s.session_id}-${idx}`} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-mono text-xs">{s.session_id}</td>
                      <td className="py-2 pr-4">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Tip: bookmark /admin after you log in once; the cookie keeps it open.
        </p>
      </div>
    </main>
  );
}
