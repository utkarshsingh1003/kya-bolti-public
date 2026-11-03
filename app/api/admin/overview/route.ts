import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { newsSources } from "@/data/news";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  const [stats, reports, issues, questions, reps, contactMessages, pollRequests, announcements, buzzPosts, adInquiries, polls] =
    await Promise.all([
      repo.getStats(),
      repo.listReports(),
      repo.listIssues({ limit: 40 }),
      repo.listQuestions({ limit: 40 }),
      repo.listRepresentatives(),
      repo.listContactMessages(),
      repo.listPollRequests(),
      repo.listAnnouncements(false),
      repo.listBuzzPosts(false),
      repo.listAdInquiries(),
      repo.listAllPolls(),
    ]);
  return noStore({
    ok: true,
    storage: repo.mode,
    stats,
    reports,
    issues,
    questions,
    contactMessages,
    repsCount: reps.length,
    pollRequests,
    announcements,
    buzzPosts,
    adInquiries,
    polls,
    newsSources: newsSources.map((source) => ({
      id: source.id,
      name: source.name,
      feedUrl: source.feedUrl,
      enabled: source.enabled,
      language: source.language,
      scope: source.scope,
      termsNote: source.termsNote,
    })),
  });
}
