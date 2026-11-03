import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";
import { requireUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const repo = await getRepository();
  const submissions = await repo.listOwnSubmissions(auth.user.id);
  return noStore({ ok: true, ...submissions });
}
