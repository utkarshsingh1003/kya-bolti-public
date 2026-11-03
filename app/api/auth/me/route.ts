import type { NextRequest } from "next/server";
import { noStore } from "@/lib/api";
import { accountsConfigured, publicUser, sessionUserIdFromRequest } from "@/lib/accounts";
import { getUserById } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configured = accountsConfigured();
  const userId = sessionUserIdFromRequest(request);
  const user = userId ? await getUserById(userId) : null;
  return noStore({ ok: true, configured, user: user ? publicUser(user) : null });
}
