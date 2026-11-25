import { NextResponse } from "next/server";
import { handleError } from "@/server/http";
import { rotateSession } from "@/server/auth/tokens";

export async function POST() {
  try {
    await rotateSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}