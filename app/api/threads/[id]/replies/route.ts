import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { looksLikeAbuse, looksLikeSpam, replyInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = mutationGuard(request, { name: "reply-create", limit: 8, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = replyInputSchema.safeParse({ ...(body as object), threadId: id });
  if (!parsed.success) return validationError(parsed.error);
  if (looksLikeAbuse(parsed.data.body) || looksLikeSpam(parsed.data.body)) {
    return NextResponse.json({ ok: false, error: "This reply contains blocked content or spam." }, { status: 422 });
  }
  const repo = await getRepository();
  const reply = await repo.addReply(id, parsed.data.body, parsed.data.authorAlias);
  if (!reply) return NextResponse.json({ ok: false, error: "Discussion not found." }, { status: 404 });
  return noStore({ ok: true, reply }, { status: 201 });
}
