import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { pollRequestModerateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = pollRequestModerateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const repo = await getRepository();
  const requests = await repo.listPollRequests();
  const target = requests.find((item) => item.id === parsed.data.id);
  if (!target) return NextResponse.json({ ok: false, error: "Poll request not found." }, { status: 404 });

  if (parsed.data.action === "approve") {
    const updated = await repo.setPollRequestStatus(target.id, "approved", parsed.data.note || null);
    return noStore({ ok: true, request: updated });
  }
  if (parsed.data.action === "reject") {
    const updated = await repo.setPollRequestStatus(target.id, "rejected", parsed.data.note || null);
    return noStore({ ok: true, request: updated });
  }

  // Publish: create the public poll, then mark the request as published.
  if (target.createdPollId) {
    return noStore({ ok: true, request: target, pollId: target.createdPollId });
  }
  const closesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (closesAt.getTime() <= Date.now()) {
    return NextResponse.json({ ok: false, error: "Closing time must be in the future." }, { status: 400 });
  }
  const options = target.optionsHi.map((hi, index) => ({
    hi,
    en: target.optionsEn[index] ?? hi,
  }));
  const poll = await repo.createPoll({
    question: { hi: target.questionHi, en: target.questionEn },
    description: {
      hi: "नागरिक अनुरोध से स्वीकृत सामुदायिक पोल। यह अनौपचारिक जनमत है, कोई सर्वेक्षण नहीं।",
      en: "Community poll approved from a citizen request. This is informal opinion, not a survey.",
    },
    category: target.category,
    closesAt: closesAt.toISOString(),
    options,
  });
  const updated = await repo.setPollRequestStatus(target.id, "published", parsed.data.note || null, poll.id);
  return noStore({ ok: true, request: updated, poll }, { status: 201 });
}
