import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { districtMatchesState, mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { publicUser, requireUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "profile", limit: 20, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!body) return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  if (parsed.data.stateId && parsed.data.districtId && !districtMatchesState(parsed.data.stateId, parsed.data.districtId)) {
    return Response.json({ ok: false, error: "District does not belong to the selected state." }, { status: 400 });
  }

  const repo = await getRepository();
  const updated = await repo.updateUser(auth.user.id, {
    displayName: parsed.data.displayName,
    stateId: parsed.data.stateId || null,
    districtId: parsed.data.districtId || null,
    pin: parsed.data.pin ?? null,
    area: parsed.data.area || null,
  });
  if (!updated) return Response.json({ ok: false, error: "Account not found." }, { status: 404 });
  return noStore({ ok: true, user: updated });
}
