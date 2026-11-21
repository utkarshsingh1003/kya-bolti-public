import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { newsCategoryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, categories: await repo.listNewsCategories() });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsCategoryInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const category = await repo.upsertNewsCategory(parsed.data);
  return noStore({ ok: true, category }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  const id =
    (body && typeof body === "object" && "id" in body ? String((body as { id: unknown }).id) : "") ||
    new URL(request.url).searchParams.get("id") ||
    "";
  if (!id) return NextResponse.json({ ok: false, error: "Category id is required." }, { status: 400 });
  const repo = await getRepository();
  const deleted = await repo.deleteNewsCategory(id);
  return deleted
    ? noStore({ ok: true })
    : NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
}
