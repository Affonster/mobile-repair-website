import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // IMPORTANT: do NOT store passwords. Only store contact + consent + issue.
  // TODO: store in DB. For now, log and return a fake id.
  const leadId = `lead_${Date.now()}`;

  console.log("LEAD_CREATE", {
    leadId,
    ...body,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, leadId });
}
