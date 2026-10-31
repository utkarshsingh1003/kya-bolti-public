import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { voterCookie, voterFromRequest } from "@/lib/security";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repo = await getRepository();
  const voter = voterFromRequest(request);
  const polls = await repo.listPolls();
  const withResults = await Promise.all(
    polls.map(async (poll) => {
      const results = await repo.getPollResults(poll.id, voter.hash);
      return {
        poll,
        counts: results.counts,
        totalVotes: results.total,
        hasVoted: results.hasVoted,
      };
    }),
  );
  const response = noStore({
    ok: true,
    polls: withResults,
    storage: repo.mode,
    persistent: repo.mode !== "memory",
  });
  if (voter.isNew) response.cookies.set(voterCookie(voter.id));
  return response;
}
