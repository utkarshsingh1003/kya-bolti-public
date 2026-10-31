import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRateLimit,
  adminConfigured,
  clearAdminSession,
  clientIp,
  createAdminSession,
  isAdminCookieValue,
  isSameOrigin,
  rateLimit,
  sha256,
  verifyAdminPassword,
  voterCookie,
  voterFromRequest,
} from "@/lib/security";

function requestWithHeaders(headers: Record<string, string | null>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

function requestWithCookies(cookies: Record<string, string>): NextRequest {
  return {
    cookies: {
      get: (name: string) => (cookies[name] ? { name, value: cookies[name] } : undefined),
    },
  } as unknown as NextRequest;
}

afterEach(() => {
  __resetRateLimit();
});

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetRateLimit();
  });

  it("allows requests up to the limit, then blocks with retryAfter", () => {
    vi.setSystemTime(new Date("2026-10-31T10:00:00Z"));
    expect(rateLimit("k", 2, 60_000).ok).toBe(true);
    expect(rateLimit("k", 2, 60_000).ok).toBe(true);
    const blocked = rateLimit("k", 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(60);
  });

  it("resets after the window expires and isolates keys", () => {
    vi.setSystemTime(new Date("2026-10-31T10:00:00Z"));
    rateLimit("a", 1, 1_000);
    expect(rateLimit("a", 1, 1_000).ok).toBe(false);
    expect(rateLimit("b", 1, 1_000).ok).toBe(true);
    vi.setSystemTime(new Date("2026-10-31T10:00:02Z"));
    expect(rateLimit("a", 1, 1_000).ok).toBe(true);
  });
});

describe("client IP and origin checks", () => {
  it("prefers the first x-forwarded-for address", () => {
    expect(clientIp(requestWithHeaders({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(requestWithHeaders({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(requestWithHeaders({}))).toBe("unknown");
  });

  it("accepts matching origins and rejects mismatches in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isSameOrigin(requestWithHeaders({ origin: "https://kyaboltipublic.in", host: "kyaboltipublic.in" }))).toBe(true);
    expect(isSameOrigin(requestWithHeaders({ origin: "https://evil.example", host: "kyaboltipublic.in" }))).toBe(false);
    expect(isSameOrigin(requestWithHeaders({ origin: null, host: "kyaboltipublic.in" }))).toBe(false);
    expect(isSameOrigin(requestWithHeaders({ origin: "not a url", host: "kyaboltipublic.in" }))).toBe(false);
  });

  it("tolerates a missing origin for local tooling outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isSameOrigin(requestWithHeaders({ origin: null, host: "localhost:3000" }))).toBe(true);
  });
});

describe("admin authentication", () => {
  it("is disabled when credentials are absent", () => {
    expect(adminConfigured()).toBe(false);
    expect(verifyAdminPassword("anything")).toBe(false);
    expect(isAdminCookieValue("any-value")).toBe(false);
  });

  it("verifies the configured password using a constant-time comparison", () => {
    vi.stubEnv("ADMIN_PASSWORD", "a-long-test-password");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-secret");
    expect(adminConfigured()).toBe(true);
    expect(verifyAdminPassword("a-long-test-password")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
  });

  it("creates signed sessions and rejects tampered or expired values", () => {
    vi.stubEnv("ADMIN_PASSWORD", "a-long-test-password");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-secret");
    const session = createAdminSession();
    expect(isAdminCookieValue(session.value)).toBe(true);
    expect(isAdminCookieValue(`${session.value}x`)).toBe(false);
    expect(isAdminCookieValue("9999999999999.deadbeef")).toBe(false);
    expect(isAdminCookieValue("")).toBe(false);
    expect(session.options.httpOnly).toBe(true);
    expect(clearAdminSession().options.maxAge).toBe(0);
  });
});

describe("voter cookies", () => {
  it("derives a stable hash from an existing UUID cookie", () => {
    const id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
    const voter = voterFromRequest(requestWithCookies({ kbp_voter: id }));
    expect(voter.id).toBe(id);
    expect(voter.isNew).toBe(false);
    expect(voter.hash).toBe(sha256(`vote:${id}`));
  });

  it("issues a new id when the cookie is missing or malformed", () => {
    const missing = voterFromRequest(requestWithCookies({}));
    expect(missing.isNew).toBe(true);
    expect(missing.id).toMatch(/^[0-9a-f-]{36}$/i);

    const malformed = voterFromRequest(requestWithCookies({ kbp_voter: "not-a-uuid" }));
    expect(malformed.isNew).toBe(true);
    expect(malformed.id).not.toBe("not-a-uuid");
  });

  it("sets hardened cookie attributes", () => {
    const cookie = voterCookie("3f2504e0-4f89-11d3-9a0c-0305e82c3301");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
    expect(cookie.maxAge).toBeGreaterThan(0);
  });
});
