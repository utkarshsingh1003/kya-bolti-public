import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { PublicUser, User } from "@/lib/types";
import { getUserById } from "@/lib/store";
import { jsonError } from "@/lib/security";

const SESSION_COOKIE = "kbp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Account sessions are signed with a server-only secret. AUTH_SECRET is the
 * dedicated variable; ADMIN_SESSION_SECRET is accepted as a fallback so the
 * feature works on deployments that already configured admin access. No
 * default secret is ever used in production.
 */
function authSecret(): string | null {
  const secret = process.env.AUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") return null;
  return "local-development-only-session-secret";
}

export function accountsConfigured(): boolean {
  return authSecret() !== null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expected] = parts;
  if (!salt || !expected || !/^[0-9a-f]{128}$/i.test(expected)) return false;
  const derived = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (expectedBuffer.length !== derived.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}

export function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function createSessionToken(userId: string): string {
  const secret = authSecret();
  if (!secret) throw new Error("Account sessions are not configured.");
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expires}`;
  const signature = createHmac("sha256", secret).update(`session:${payload}`).digest("hex");
  return `${payload}.${signature}`;
}

export function readSessionUserId(raw: string | undefined | null): string | null {
  const secret = authSecret();
  if (!secret || !raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
  if (!expiresRaw || !/^\d{10,16}$/.test(expiresRaw)) return null;
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return null;
  if (Number(expiresRaw) < Date.now()) return null;
  const expected = createHmac("sha256", secret).update(`session:${userId}.${expiresRaw}`).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return userId;
}

export function sessionCookie(value: string) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function sessionUserIdFromRequest(request: NextRequest): string | null {
  return readSessionUserId(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function currentUser(request: NextRequest): Promise<User | null> {
  const userId = sessionUserIdFromRequest(request);
  if (!userId) return null;
  return getUserById(userId);
}

export async function requireUser(request: NextRequest): Promise<{ user: User } | { response: Response }> {
  if (!accountsConfigured()) {
    return {
      response: jsonError(
        "Accounts are not configured on this deployment. Set AUTH_SECRET on the server.",
        503,
      ),
    };
  }
  const user = await currentUser(request);
  if (!user) return { response: jsonError("Please log in to continue.", 401) };
  return { user };
}

export const sessionCookieName = SESSION_COOKIE;
