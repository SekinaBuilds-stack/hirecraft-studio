//errors + validation helper
import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";

// An error we throw on purpose, carrying the HTTP status to send back
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Validate data against a Zod schema, or throw a 400 with readable details
export function parseOrThrow<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(
      400,
      "Validation failed",
      result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    );
  }
  return result.data;
}

// One place that turns any error into a clean JSON response
export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: err.message, details: err.details },
      { status: err.status },
    );
  }
  console.error(err); // full detail goes to the server log only
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}