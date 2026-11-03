import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, jsonError, rateLimit } from "@/lib/security";
import { getDistrict } from "@/data/geo";
import { demoModeActive } from "@/lib/store";

export async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return await request.json();
  } catch {
    return null;
  }
}

export function mutationGuard(
  request: NextRequest,
  options: { name: string; limit: number; windowMs: number },
): Response | null {
  if (demoModeActive()) {
    return jsonError(
      "This action is temporarily unavailable: the production database is not enabled on this deployment yet. Browsing and demo content remain available.",
      503,
    );
  }
  if (!isSameOrigin(request)) return jsonError("Invalid request origin.", 403);
  const limit = rateLimit(`${options.name}:${clientIp(request)}`, options.limit, options.windowMs);
  if (!limit.ok) {
    return jsonError("Too many requests. Please wait and try again.", 429, {
      retryAfter: limit.retryAfter,
    });
  }
  return null;
}

export function validationError(error: z.ZodError): Response {
  const first = error.issues[0];
  return jsonError(first?.message ?? "Invalid input.", 400, { field: first?.path?.join(".") });
}

export function districtMatchesState(stateId: string, districtId: string): boolean {
  const found = getDistrict(districtId);
  return Boolean(found && found.state.id === stateId);
}

export function safeJson(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function noStore(data: unknown, init?: ResponseInit): NextResponse {
  return safeJson(data, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  });
}
