import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { buzzInputSchema, buzzManageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, posts: await repo.listBuzzPosts(false) });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = buzzInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    body: parsed.data.body,
    category: parsed.data.category,
    platform: parsed.data.platform,
    sourceUrl: parsed.data.sourceUrl || null,
    imageUrl: parsed.data.imageUrl || null,
    status: parsed.data.status,
  };
  const repo = await getRepository();
  if (parsed.data.id) {
    const updated = await repo.updateBuzzPost(parsed.data.id, input);
    if (!updated) return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
    return noStore({ ok: true, post: updated });
  }
  const post = await repo.createBuzzPost({ ...input, origin: "admin" });
  return noStore({ ok: true, post }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = buzzManageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  if (parsed.data.action === "delete") {
    const deleted = await repo.deleteBuzzPost(parsed.data.id);
    return deleted
      ? noStore({ ok: true })
      : NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }
  const ok = await repo.setBuzzStatus(parsed.data.id, parsed.data.action === "publish" ? "published" : "draft");
  return ok ? noStore({ ok: true }) : NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
}
