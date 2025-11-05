import { NextResponse } from "next/server";
type Comment = { id: string; author: string; text: string; ts: number; anchor?: string };
let state: { status: "draft"|"in_review"|"changes_requested"|"approved"; comments: Comment[] } = {
  status: "draft",
  comments: [],
};
export async function GET() { return NextResponse.json(state); }
export async function POST(req: Request) {
  const { action, text, anchor } = await req.json();
  if (action === "requestReview") state.status = "in_review";
  if (action === "approve") state.status = "approved";
  if (action === "requestChanges") state.status = "changes_requested";
  if (action === "comment" && text) state.comments.push({ id: crypto.randomUUID(), author: "you", text, ts: Date.now(), anchor });
  return NextResponse.json(state);
}
