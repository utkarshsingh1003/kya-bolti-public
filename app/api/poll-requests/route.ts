import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository, isPersistentMode } from "@/lib/store";
import { districtMatchesState, mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { looksLikeAbuse, looksLikeSpam, pollRequestInputSchema } from "@/lib/validation";
import { sessionUserIdFromRequest } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = await getRepository();
  const requests = await repo.listPublicPollRequests();
  return noStore({
    ok: true,
    requests: requests.map((request) => ({
      id: request.id,
      questionHi: request.questionHi,
      questionEn: request.questionEn,
      optionsHi: request.optionsHi,
      optionsEn: request.optionsEn,
      category: request.category,
      status: request.status,
      createdAt: request.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "poll-request", limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = pollRequestInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (!districtMatchesState(parsed.data.stateId, parsed.data.districtId)) {
    return NextResponse.json({ ok: false, error: "District does not belong to the selected state." }, { status: 400 });
  }
  if (looksLikeAbuse(parsed.data.purpose) || looksLikeAbuse(parsed.data.questionHi) || looksLikeAbuse(parsed.data.questionEn)) {
    return NextResponse.json({ ok: false, error: "This request contains abusive language." }, { status: 422 });
  }
  if (looksLikeSpam(parsed.data.purpose)) {
    return NextResponse.json({ ok: false, error: "This looks like spam." }, { status: 422 });
  }

  const repo = await getRepository();
  const saved = await repo.createPollRequest({
    ...parsed.data,
    contact: parsed.data.contact || undefined,
    ownerId: sessionUserIdFromRequest(request),
  });
  return noStore({ ok: true, id: saved.id, status: saved.status, persistent: isPersistentMode(repo.mode) }, { status: 201 });
}
