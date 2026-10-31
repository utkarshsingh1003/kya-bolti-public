import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { voteInputSchema } from "@/lib/validation";
import { voterCookie, voterFromRequest } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "vote", limit: 12, windowMs: 60_000 });
  if (guard) return guard;

  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = voteInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const voter = voterFromRequest(request);
  const repo = await getRepository();
  const outcome = await repo.castVote(parsed.data.pollId, parsed.data.optionId, voter.hash);

  if (!outcome.ok) {
    const status =
      outcome.reason === "duplicate" ? 409 : outcome.reason === "not_found" ? 404 : 400;
    const message =
      outcome.reason === "duplicate"
        ? "You have already voted in this poll."
        : outcome.reason === "closed"
          ? "This poll has closed."
          : "Invalid poll option.";
    const response = noStore({ ok: false, error: message, reason: outcome.reason }, { status });
    if (voter.isNew) response.cookies.set(voterCookie(voter.id));
    return response;
  }

  const results = await repo.getPollResults(parsed.data.pollId, voter.hash);
  const response = noStore({
    ok: true,
    counts: results.counts,
    totalVotes: results.total,
    hasVoted: true,
    persistent: repo.mode !== "memory",
  });
  if (voter.isNew) response.cookies.set(voterCookie(voter.id));
  return response;
}
