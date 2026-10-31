import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { moderationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const { action, targetType, targetId } = parsed.data;
  let ok = false;

  if (targetType === "report") {
    ok = await repo.resolveReport(targetId);
  } else if (targetType === "contact") {
    ok = await repo.resolveContactMessage(targetId);
  } else if (action === "resolve") {
    return NextResponse.json({ ok: false, error: "Resolve is only valid for reports." }, { status: 400 });
  } else if (targetType === "review") {
    ok = await repo.setReviewStatus(targetId, action === "hide" ? "hidden" : "published");
  } else if (targetType === "reply") {
    ok = await repo.setReplyStatus(targetId, action === "hide" ? "hidden" : "published");
  } else if (targetType === "thread") {
    ok = await repo.setThreadStatus(targetId, action === "hide" ? "hidden" : "published");
  } else {
    return NextResponse.json({ ok: false, error: "Issue visibility is managed through status updates." }, { status: 400 });
  }

  if (!ok) return NextResponse.json({ ok: false, error: "Target not found." }, { status: 404 });
  return noStore({ ok: true, action, targetType, targetId });
}
