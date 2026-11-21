import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import type { VyangBaanInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, posts: await repo.listVyangBaan() });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 201 });
  const repo = await getRepository();
  const post = await repo.createVyangBaan(body as VyangBaanInput);
  return noStore({ ok: true, post }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const repo = await getRepository();
  // Handle { id, action } for status updates
  if (body && typeof body === "object" && "id" in body && "action" in body && typeof (body as Record<string, unknown>).action === "string") {
    const action = (body as { action: string }).action as "published" | "archived";
    const updated = await repo.updateVyangBaan(body.id as string, { status: action });
    if (!updated) return NextResponse.json({ ok: false, error: "Vyang Baan post not found." }, { status: 404 });
    return noStore({ ok: true, post: updated });
  }
  // Handle full VyangBaan input - extract id from body
  const bodyInput = body as VyangBaanInput;
  const updated = await repo.updateVyangBaan(
    (body as { id: string }).id,
    bodyInput
  );
  if (!updated) return NextResponse.json({ ok: false, error: "Vyang Baan post not found." }, { status: 404 });
  return noStore({ ok: true, post: updated });
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "ID required." }, { status: 400 });
  const repo = await getRepository();
  const deleted = await repo.deleteVyangBaan(id);
  return deleted ? noStore({ ok: true }) : NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
}