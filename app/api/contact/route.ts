import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository, isPersistentMode } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { contactInputSchema, looksLikeAbuse, looksLikeSpam } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "contact-create", limit: 4, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = contactInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (looksLikeAbuse(parsed.data.message) || looksLikeSpam(parsed.data.message)) {
    return NextResponse.json({ ok: false, error: "This message contains blocked content or spam." }, { status: 422 });
  }
  const repo = await getRepository();
  const message = await repo.createContactMessage(parsed.data);
  return noStore(
    {
      ok: true,
      id: message.id,
      persistent: isPersistentMode(repo.mode),
      storage: repo.mode,
    },
    { status: 201 },
  );
}
