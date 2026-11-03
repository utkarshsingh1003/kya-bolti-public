import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { accountsConfigured, createSessionToken, hashPassword, publicUser, sessionCookie } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!accountsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Account registration is not configured on this deployment. Set AUTH_SECRET on the server." },
      { status: 503 },
    );
  }
  const guard = mutationGuard(request, { name: "register", limit: 5, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;

  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const repo = await getRepository();
  if (await repo.getUserByEmail(parsed.data.email)) {
    return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
  }

  try {
    const user = await repo.createUser({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash: hashPassword(parsed.data.password),
    });
    const response = noStore({ ok: true, user: publicUser(user) }, { status: 201 });
    response.cookies.set(sessionCookie(createSessionToken(user.id)));
    return response;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function GET() {
  return noStore({ ok: true, configured: accountsConfigured() });
}
