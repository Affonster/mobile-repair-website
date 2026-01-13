import { NextResponse } from "next/server";
import { sql } from "../../../src/server/db";

function clean(s: any) {
  return String(s ?? "").trim();
}

function isLikelyEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isLikelyPhone(v: string) {
  // simple, practical (E.164-ish / local digits). Keep len constraints.
  return /^[+0-9][0-9\s-]{7,18}$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionId = clean(body?.sessionId);
    const name = clean(body?.name);
    const contact = clean(body?.contact);
    const issue = clean(body?.issue);
    const consentFollowUp = body?.consentFollowUp === true;

    const lat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
    const lng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);

    if (!sessionId || sessionId.length > 100) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!(isLikelyEmail(contact) || isLikelyPhone(contact))) {
      return NextResponse.json({ error: "Invalid contact" }, { status: 400 });
    }
    if (issue.length < 3 || issue.length > 200) {
      return NextResponse.json({ error: "Invalid issue" }, { status: 400 });
    }
    if (!consentFollowUp) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    const latDb = Number.isFinite(lat) ? lat : null;
    const lngDb = Number.isFinite(lng) ? lng : null;

    const result = await sql`
      INSERT INTO leads (session_id, name, contact, issue, lat, lng, consent_follow_up, consent_at)
      VALUES (${sessionId}, ${name}, ${contact}, ${issue}, ${latDb}, ${lngDb}, ${true}, now())
      RETURNING id
    `;

    return NextResponse.json({ ok: true, leadId: result.rows[0].id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
