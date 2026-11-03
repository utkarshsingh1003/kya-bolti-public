import type { NextRequest } from "next/server";
import { getRepository, isPersistentMode } from "@/lib/store";
import { noStore } from "@/lib/api";
import { sessionUserIdFromRequest } from "@/lib/accounts";
import { sha256 } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repo = await getRepository();
  const userId = sessionUserIdFromRequest(request);
  const voterHash = userId ? sha256(`user:${userId}`) : "";
  const polls = await repo.listPolls();
  const withResults = await Promise.all(
    polls.map(async (poll) => {
      const results = await repo.getPollResults(poll.id, voterHash);
      return {
        poll,
        counts: results.counts,
        totalVotes: results.total,
        hasVoted: results.hasVoted,
      };
    }),
  );
  return noStore({
    ok: true,
    polls: withResults,
    authenticated: Boolean(userId),
    storage: repo.mode,
    persistent: isPersistentMode(repo.mode),
  });
}
