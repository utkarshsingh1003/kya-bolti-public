import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import {
  accountsConfigured,
  createSessionToken,
  publicUser,
  sessionCookie,
  verifyPassword,
} from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!accountsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Account login is not configured on this deployment. Set AUTH_SECRET on the server." },
      { status: 503 },
    );
  }
  const guard = mutationGuard(request, { name: "login", limit: 10, windowMs: 15 * 60 * 1000 });
  if (guard) return guard;

  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const repo = await getRepository();
  const user = await repo.getUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
  }

  const response = noStore({ ok: true, user: publicUser(user) });
  response.cookies.set(sessionCookie(createSessionToken(user.id)));
  return response;
}
