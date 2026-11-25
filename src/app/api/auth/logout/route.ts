import { NextResponse } from "next/server";
import { handleError } from "@/server/http";
import { endSession } from "@/server/auth/tokens";

export async function POST() {
  try {
    await endSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}