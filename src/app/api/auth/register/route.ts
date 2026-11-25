import { NextResponse } from "next/server";
import { handleError, parseOrThrow } from "@/server/http";
import { registerSchema } from "@/server/schemas/auth.schema";
import { registerUser } from "@/server/services/auth.service";
import { issueSession } from "@/server/auth/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const input = parseOrThrow(registerSchema, body);
    const user = await registerUser(input);
    await issueSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}