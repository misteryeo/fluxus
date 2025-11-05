import { NextResponse } from "next/server";
import { mockPRs } from "@/lib/mockData"; // from the Figma zip

export async function GET() {
  return NextResponse.json({ prs: mockPRs });
}
