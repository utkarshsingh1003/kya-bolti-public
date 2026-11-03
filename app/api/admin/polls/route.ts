import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { pollCreateSchema, pollManageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  const [polls, pollRequests] = await Promise.all([repo.listAllPolls(), repo.listPollRequests()]);
  return noStore({ ok: true, polls, pollRequests });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = pollCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (new Date(parsed.data.closesAt).getTime() <= Date.now()) {
    return NextResponse.json({ ok: false, error: "Closing time must be in the future." }, { status: 400 });
  }
  const repo = await getRepository();
  const poll = await repo.createPoll({
    question: parsed.data.question,
    description: parsed.data.description,
    category: parsed.data.category,
    closesAt: new Date(parsed.data.closesAt).toISOString(),
    options: parsed.data.options,
    featured: parsed.data.featured,
    sponsored: parsed.data.sponsored,
    sponsorLabel: parsed.data.sponsorLabel ?? null,
  });
  return noStore({ ok: true, poll }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = pollManageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const poll = await repo.updatePollStatus(parsed.data.id, parsed.data.action);
  if (!poll) return NextResponse.json({ ok: false, error: "Poll not found." }, { status: 404 });
  return noStore({ ok: true, poll });
}
