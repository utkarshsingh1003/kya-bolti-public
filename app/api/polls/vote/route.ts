import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository, isPersistentMode } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { voteInputSchema } from "@/lib/validation";
import { sha256 } from "@/lib/security";
import { requireUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "vote", limit: 12, windowMs: 60_000 });
  if (guard) return guard;

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = voteInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const voterHash = sha256(`user:${auth.user.id}`);
  const repo = await getRepository();
  const outcome = await repo.castVote(parsed.data.pollId, parsed.data.optionId, voterHash);

  if (!outcome.ok) {
    const status = outcome.reason === "duplicate" ? 409 : outcome.reason === "not_found" ? 404 : 400;
    const message =
      outcome.reason === "duplicate"
        ? "You have already voted in this poll."
        : outcome.reason === "closed"
          ? "This poll has closed."
          : "Invalid poll option.";
    return noStore({ ok: false, error: message, reason: outcome.reason }, { status });
  }

  const results = await repo.getPollResults(parsed.data.pollId, voterHash);
  return noStore({
    ok: true,
    counts: results.counts,
    totalVotes: results.total,
    hasVoted: true,
    persistent: isPersistentMode(repo.mode),
  });
}
