import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository, isPersistentMode } from "@/lib/store";
import { districtMatchesState, mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { looksLikeAbuse, questionInputSchema } from "@/lib/validation";
import { sessionUserIdFromRequest } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get("stateId") ?? undefined;
  const districtId = url.searchParams.get("districtId") ?? undefined;
  const repo = await getRepository();
  const questions = await repo.listQuestions({ stateId, districtId, limit: 60 });
  return noStore({ ok: true, questions, storage: repo.mode });
}

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "question-create", limit: 6, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = questionInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.stateId && parsed.data.districtId && !districtMatchesState(parsed.data.stateId, parsed.data.districtId)) {
    return NextResponse.json({ ok: false, error: "District does not belong to the selected state." }, { status: 400 });
  }
  if (looksLikeAbuse(parsed.data.question)) {
    return NextResponse.json({ ok: false, error: "This question contains blocked content." }, { status: 422 });
  }
  const repo = await getRepository();
  const question = await repo.createQuestion(parsed.data, sessionUserIdFromRequest(request));
  return noStore(
    { ok: true, question, persistent: isPersistentMode(repo.mode), storage: repo.mode },
    { status: 201 },
  );
}
