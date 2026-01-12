import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // TODO: store in DB (Postgres/Mongo/etc). For now, just log.
  console.log("EVENT", {
    ...body,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
