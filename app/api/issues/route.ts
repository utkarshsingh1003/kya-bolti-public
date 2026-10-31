import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { districtMatchesState, mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { issueInputSchema, issueStatuses, looksLikeAbuse, looksLikeSpam } from "@/lib/validation";
import type { IssueStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get("stateId") ?? undefined;
  const districtId = url.searchParams.get("districtId") ?? undefined;
  const statusRaw = url.searchParams.get("status");
  const status =
    statusRaw && issueStatuses.includes(statusRaw as IssueStatus) ? (statusRaw as IssueStatus) : undefined;
  const repo = await getRepository();
  const issues = await repo.listIssues({ stateId, districtId, status, limit: 60 });
  return noStore({ ok: true, issues, storage: repo.mode });
}

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "issue-create", limit: 5, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = issueInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (!districtMatchesState(parsed.data.stateId, parsed.data.districtId)) {
    return NextResponse.json({ ok: false, error: "District does not belong to the selected state." }, { status: 400 });
  }
  if (looksLikeAbuse(parsed.data.description) || looksLikeAbuse(parsed.data.title)) {
    return NextResponse.json(
      { ok: false, error: "This text contains threats or abusive language and cannot be published." },
      { status: 422 },
    );
  }
  if (looksLikeSpam(parsed.data.description)) {
    return NextResponse.json({ ok: false, error: "This looks like spam. Please shorten it and remove repeated links." }, { status: 422 });
  }

  const repo = await getRepository();
  const issue = await repo.createIssue(parsed.data);
  return noStore(
    {
      ok: true,
      trackingCode: issue.trackingCode,
      id: issue.id,
      persistent: repo.mode !== "memory",
      storage: repo.mode,
    },
    { status: 201 },
  );
}
