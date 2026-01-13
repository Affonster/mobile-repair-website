import { NextResponse } from "next/server";
import { sql } from "../../../src/server/db";


function clean(s: any) {
  return String(s ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const type = clean(body?.type);
    const action = clean(body?.action);
    const sessionId = clean(body?.sessionId);
    const leadId = clean(body?.leadId);
    const shopId = clean(body?.shopId);
    const shopName = clean(body?.shopName);

    if (!type || type.length > 40 || !sessionId || sessionId.length > 100) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await sql`
      INSERT INTO events (session_id, lead_id, type, action, shop_place_id, shop_name)
      VALUES (
        ${sessionId},
        ${leadId || null},
        ${type},
        ${action || null},
        ${shopId || null},
        ${shopName || null}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
