import { NextResponse } from "next/server";
import { handleError, parseOrThrow } from "@/server/http";
import { requireUser } from "@/server/guards/require-user";
import { updateApplicationSchema } from "@/server/schemas/application.schema";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/server/services/applications.service";

// In current Next.js, route params arrive as a Promise, so we await them
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const application = await getApplication(user.id, id);
    return NextResponse.json({ application });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const input = parseOrThrow(updateApplicationSchema, body);
    const application = await updateApplication(user.id, id, input);
    return NextResponse.json({ application });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteApplication(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}