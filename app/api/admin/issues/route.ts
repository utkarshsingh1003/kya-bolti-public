import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { issueUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = issueUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const issue = await repo.updateIssue(
    parsed.data.id,
    parsed.data.status,
    parsed.data.note,
    parsed.data.officialComplaintUrl || undefined,
  );
  if (!issue) return NextResponse.json({ ok: false, error: "Issue not found." }, { status: 404 });
  return noStore({ ok: true, issue });
}
