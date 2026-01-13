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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin</h1>
        <p className="mt-1 text-slate-600">Latest leads and shop-contact events.</p>

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
                      <td className="py-2 pr-4">{new Date(l.created_at).toLocaleString()}</td>
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
                      <td className="py-2 pr-4">{e.shop_name || e.shop_place_id || "—"}</td>
                      <td className="py-2 pr-4">{e.lead_id || "—"}</td>
                      <td className="py-2 pr-4">{new Date(e.created_at).toLocaleString()}</td>
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
