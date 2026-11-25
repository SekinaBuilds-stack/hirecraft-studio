import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/http";
import type {
  CreateApplicationInput,
  ListQuery,
  UpdateApplicationInput,
} from "@/server/schemas/application.schema";

const notFound = () => new HttpError(404, "Application not found");

export function listApplications(userId: string, query: ListQuery) {
  return prisma.application.findMany({
    where: {
      userId, // ← the golden rule: always scoped to the logged-in user
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { company: { contains: query.q, mode: "insensitive" } },
              { role: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(userId: string, id: string) {
  const application = await prisma.application.findFirst({ where: { id, userId } });
  if (!application) throw notFound();
  return application;
}

export function createApplication(userId: string, input: CreateApplicationInput) {
  // userId comes from the session and is placed last so nothing can override it
  return prisma.application.create({ data: { ...input, userId } });
}

export async function updateApplication(
  userId: string,
  id: string,
  input: UpdateApplicationInput,
) {
  const existing = await prisma.application.findFirst({
    where: { id, userId },
    select: { appliedAt: true },
  });
  if (!existing) throw notFound();

  const data = { ...input };

  // Business rule: moving a card to APPLIED records the date automatically
  if (input.status === "APPLIED" && input.appliedAt === undefined && !existing.appliedAt) {
    data.appliedAt = new Date();
  }

  return prisma.application.update({ where: { id, userId }, data });
}

export async function deleteApplication(userId: string, id: string) {
  // deleteMany lets us put userId in the filter and report how many rows matched
  const result = await prisma.application.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw notFound();
}
