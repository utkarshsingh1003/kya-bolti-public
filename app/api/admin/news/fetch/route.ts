import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { refreshManagedNews, publishScheduledNews } from "@/lib/news-service";
import { newsFetchRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  const [logs, sources, settings] = await Promise.all([
    repo.listNewsFetchLogs(50),
    repo.listManagedNewsSources(),
    repo.getNewsAutomationSettings(),
  ]);
  return noStore({ ok: true, logs, sources, settings });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = (await readJson(request)) ?? {};
  const parsed = newsFetchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid source id." }, { status: 400 });
  }

  const repo = await getRepository();
  const publishedBySchedule = await publishScheduledNews(repo);
  const result = await refreshManagedNews({ sourceId: parsed.data.sourceId, repo });
  const logs = await repo.listNewsFetchLogs(20);
  return noStore({
    ok: result.errors.length === 0,
    ...result,
    publishedBySchedule,
    logs,
  });
}
