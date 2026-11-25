//register / login logic
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/http";
import type { LoginInput, RegisterInput } from "@/server/schemas/auth.schema";

const SALT_ROUNDS = 10;

// Used so a login for an unknown email takes about as long as a real one
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

const publicUser = { id: true, email: true, name: true } as const;

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    return await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
      select: publicUser, // never return passwordHash
    });
  } catch (err) {
    // P2002 = unique constraint violation (the @unique on email)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw err;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always run a bcrypt comparison, even if the user doesn't exist
  const hashToCheck = user ? user.passwordHash : DUMMY_HASH;
  const passwordOk = await bcrypt.compare(input.password, hashToCheck);

  if (!user || !passwordOk) {
    // Same message for both cases, so attackers can't discover which emails exist
    throw new HttpError(401, "Invalid email or password");
  }

  return { id: user.id, email: user.email, name: user.name };
}