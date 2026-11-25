import { z } from "zod";

export const STATUSES = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

// Three meanings: undefined = "not provided", null = "clear this value",
// and "" (an empty form field) is converted to null.
const optionalText = (max: number) =>
  z
    .union([
      z.string().trim().max(max).transform((v) => (v === "" ? null : v)),
      z.null(),
    ])
    .optional();

const isHttpUrl = (value: string) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const optionalUrl = z
  .union([
    z.string().trim().max(2000).refine(isHttpUrl, "Must be a valid http(s) URL"),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional();

const optionalDate = z
  .union([
    z
      .string()
      .trim()
      .min(1)
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
      .transform((v) => new Date(v)),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional();

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(120),
  status: z.enum(STATUSES).optional(), // the database defaults it to WISHLIST
  location: optionalText(120),
  jobUrl: optionalUrl,
  salary: optionalText(80),
  notes: optionalText(5000),
  appliedAt: optionalDate,
});

// PATCH: every field optional, but at least one must be present
export const updateApplicationSchema = createApplicationSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "Provide at least one field to update");

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;