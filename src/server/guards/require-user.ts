//the guard
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/http";
import { getAccessUserId } from "@/server/auth/tokens";

export async function requireUser() {
  const userId = await getAccessUserId();
  if (!userId) throw new HttpError(401, "You must be logged in");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  // A valid token for a deleted account must not work
  if (!user) throw new HttpError(401, "You must be logged in");

  return user;
}