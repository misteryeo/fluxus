import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { channels, drafts } = await req.json();
  const result = Object.fromEntries(Object.entries(channels ?? {}).map(([k, v]) => [k, v ? "queued" : "skipped"]));
  return NextResponse.json({ ok: true, result, draftsSaved: !!drafts });
}
