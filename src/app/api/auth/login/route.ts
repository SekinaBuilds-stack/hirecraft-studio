import { NextResponse } from "next/server";
import { handleError, parseOrThrow } from "@/server/http";
import { loginSchema } from "@/server/schemas/auth.schema";
import { loginUser } from "@/server/services/auth.service";
import { issueSession } from "@/server/auth/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const input = parseOrThrow(loginSchema, body);
    const user = await loginUser(input);
    await issueSession(user.id);
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err);
  }
}