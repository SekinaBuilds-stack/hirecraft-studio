import { NextResponse } from "next/server";
import { handleError } from "@/server/http";
import { requireUser } from "@/server/guards/require-user";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err);
  }
}