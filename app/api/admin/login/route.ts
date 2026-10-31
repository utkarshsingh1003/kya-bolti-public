import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { readJson, validationError } from "@/lib/api";
import {
  adminConfigured,
  clientIp,
  createAdminSession,
  rateLimit,
  verifyAdminPassword,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin access is not configured. Set ADMIN_PASSWORD (12+ chars) and ADMIN_SESSION_SECRET in the deployment environment.",
      },
      { status: 503 },
    );
  }
  const limit = rateLimit(`admin-login:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }
  const session = createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(session);
  return response;
}
