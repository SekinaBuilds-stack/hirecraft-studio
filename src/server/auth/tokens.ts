//access + refresh token logic
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/http";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_TTL_SECONDS = 15 * 60;            // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;  // 7 days
const REUSE_GRACE_MS = 10_000;                 // tolerance for simultaneous refreshes
const isProd = process.env.NODE_ENV === "production";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short (use at least 32 characters)");
  }
  return new TextEncoder().encode(secret);
}

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const newOpaqueToken = () => randomBytes(32).toString("base64url");

async function signAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

async function setAuthCookies(userId: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, await signAccessToken(userId), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",   // only ever sent from our own site
    path: "/api/auth",    // only sent to the auth routes
    maxAge: REFRESH_TTL_SECONDS,
  });
}

async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { path: "/api/auth", maxAge: 0 });
}

// Called after register / login: starts a brand-new token family
export async function issueSession(userId: string) {
  const refreshToken = newOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      familyId: randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    },
  });
  await setAuthCookies(userId, refreshToken);
}

// Called by POST /api/auth/refresh: swaps a used refresh token for a new pair
export async function rotateSession() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  if (!presented) throw new HttpError(401, "No refresh token");

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presented) },
  });
  if (!record || record.expiresAt < new Date()) {
    await clearAuthCookies();
    throw new HttpError(401, "Session expired, please log in again");
  }

  // Atomically "claim" the token. Only ONE caller can flip revokedAt from null.
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (claimed.count === 0) {
    // Someone already used this token. Re-read to see exactly when.
    const fresh = await prisma.refreshToken.findUnique({ where: { id: record.id } });
    const justRevoked =
      fresh?.revokedAt && Date.now() - fresh.revokedAt.getTime() < REUSE_GRACE_MS;

    if (!justRevoked) {
      // Old token replayed later: treat as theft and kill the whole family
      await prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await clearAuthCookies();
    }
    throw new HttpError(401, "Refresh token already used");
  }

  // We won the claim: issue the next token in the same family
  const nextToken = newOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(nextToken),
      familyId: record.familyId,
      userId: record.userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    },
  });
  await setAuthCookies(record.userId, nextToken);
}

// Called by POST /api/auth/logout
export async function endSession() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  if (presented) {
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(presented) },
    });
    if (record) {
      await prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }
  await clearAuthCookies();
}

// Used by the guard: verifies the 15-minute access token (no DB call)
export async function getAccessUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null; // expired, tampered with, or garbage
  }
}