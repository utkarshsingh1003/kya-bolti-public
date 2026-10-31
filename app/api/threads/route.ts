import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { districtMatchesState, mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { looksLikeAbuse, looksLikeSpam, threadInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get("stateId") ?? undefined;
  const districtId = url.searchParams.get("districtId") ?? undefined;
  const repo = await getRepository();
  const threads = await repo.listThreads({ stateId, districtId, limit: 60 });
  return noStore({ ok: true, threads, storage: repo.mode });
}

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "thread-create", limit: 4, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = threadInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (!districtMatchesState(parsed.data.stateId, parsed.data.districtId)) {
    return NextResponse.json({ ok: false, error: "District does not belong to the selected state." }, { status: 400 });
  }
  if (looksLikeAbuse(parsed.data.body) || looksLikeSpam(parsed.data.body)) {
    return NextResponse.json({ ok: false, error: "This post contains blocked content or spam." }, { status: 422 });
  }
  const repo = await getRepository();
  const thread = await repo.createThread(parsed.data);
  return noStore(
    { ok: true, thread, persistent: repo.mode !== "memory", storage: repo.mode },
    { status: 201 },
  );
}
