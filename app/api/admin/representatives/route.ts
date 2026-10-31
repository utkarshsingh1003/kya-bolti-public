import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { representativeImportSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = representativeImportSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const rows = parsed.data.representatives.map((row) => ({
    ...row,
    party: row.party ?? null,
    officialContact: row.officialContact ?? null,
    verificationStatus: "verified" as const,
  }));
  const repo = await getRepository();
  const count = await repo.importRepresentatives(rows);
  return noStore({
    ok: true,
    imported: count,
    sourceNote: parsed.data.sourceNote,
    storage: repo.mode,
  });
}
