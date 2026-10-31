import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";
import { trackQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = trackQuerySchema.safeParse({ code: url.searchParams.get("code") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid tracking code (e.g. KBP-A1B2C3)." }, { status: 400 });
  }
  const repo = await getRepository();
  const issue = await repo.getIssueByCode(parsed.data.code);
  if (!issue) {
    return NextResponse.json({ ok: false, error: "No issue was found for this code." }, { status: 404 });
  }
  return noStore({
    ok: true,
    issue: {
      trackingCode: issue.trackingCode,
      category: issue.category,
      title: issue.title,
      description: issue.description,
      area: issue.area,
      districtId: issue.districtId,
      stateId: issue.stateId,
      status: issue.status,
      isDemo: issue.isDemo,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      officialComplaintUrl: issue.officialComplaintUrl,
      events: issue.events,
    },
  });
}
