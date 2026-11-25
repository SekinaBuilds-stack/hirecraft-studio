import { NextResponse } from "next/server";
import { handleError, parseOrThrow } from "@/server/http";
import { requireUser } from "@/server/guards/require-user";
import {
  createApplicationSchema,
  listQuerySchema,
} from "@/server/schemas/application.schema";
import { createApplication, listApplications } from "@/server/services/applications.service";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const query = parseOrThrow(
      listQuerySchema,
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const applications = await listApplications(user.id, query);
    return NextResponse.json({ applications });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const input = parseOrThrow(createApplicationSchema, body);
    const application = await createApplication(user.id, input);
    return NextResponse.json({ application }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}