import { NextResponse } from "next/server";

// Trigger.dev v3 SDK runs tasks via its managed API and does not require
// a Next.js webhook handler for this app's current execution flow.
export async function POST() {
  return NextResponse.json({ ok: true });
}