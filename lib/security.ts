import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** In-memory fixed-window limiter. Per-instance on serverless; see SECURITY.md. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function __resetRateLimit() {
  buckets.clear();
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) {
    // Same-origin browser POSTs include Origin. Missing Origin is only tolerated
    // for local tooling; cron uses a bearer secret instead of this check.
    return process.env.NODE_ENV !== "production";
  }
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

const VOTER_COOKIE = "kbp_voter";

export function voterFromRequest(request: NextRequest): { hash: string; id: string; isNew: boolean } {
  const existing = request.cookies.get(VOTER_COOKIE)?.value;
  const valid = existing && /^[0-9a-f-]{36}$/i.test(existing);
  const id = valid ? existing : randomUUID();
  return { id, hash: sha256(`vote:${id}`), isNew: !valid };
}

export const voterCookieName = VOTER_COOKIE;

export function voterCookie(id: string) {
  return {
    name: VOTER_COOKIE,
    value: id,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

const ADMIN_COOKIE = "kbp_admin";
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

function adminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createAdminSession(): { name: string; value: string; options: Record<string, unknown> } {
  const expires = Date.now() + ADMIN_TTL_MS;
  const signature = createHmac("sha256", adminSecret()).update(`admin:${expires}`).digest("hex");
  return {
    name: ADMIN_COOKIE,
    value: `${expires}.${signature}`,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_TTL_MS / 1000,
    },
  };
}

export function clearAdminSession() {
  return {
    name: ADMIN_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export function isAdminCookieValue(raw: string | undefined | null): boolean {
  if (!adminConfigured() || !raw) return false;
  const [expiresRaw, signature] = raw.split(".");
  const expires = Number(expiresRaw);
  // Reject malformed values before hex decoding: Buffer.from() silently
  // ignores trailing non-hex characters, which would weaken the comparison.
  if (!/^\d{10,16}$/.test(expiresRaw ?? "")) return false;
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  if (!expires || expires < Date.now()) return false;
  const expected = createHmac("sha256", adminSecret()).update(`admin:${expires}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export const adminCookieName = ADMIN_COOKIE;

export function isAdminRequest(request: NextRequest): boolean {
  return isAdminCookieValue(request.cookies.get(ADMIN_COOKIE)?.value);
}

export function requireAdmin(request: NextRequest): Response | null {
  if (!adminConfigured()) {
    return jsonError("Admin access is not configured on this deployment.", 503);
  }
  if (!isAdminRequest(request)) return jsonError("Unauthorized.", 401);
  return null;
}
