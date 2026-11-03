import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { announcementInputSchema, announcementManageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, announcements: await repo.listAnnouncements(false) });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = announcementInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const input = {
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
    stateId: parsed.data.stateId ?? null,
    districtId: parsed.data.districtId ?? null,
    sourceLabel: parsed.data.sourceLabel || null,
    sourceUrl: parsed.data.sourceUrl || null,
    imageUrl: parsed.data.imageUrl || null,
    status: parsed.data.status,
    publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt).toISOString() : null,
  };
  if (parsed.data.id) {
    const updated = await repo.updateAnnouncement(parsed.data.id, input);
    if (!updated) return NextResponse.json({ ok: false, error: "Announcement not found." }, { status: 404 });
    return noStore({ ok: true, announcement: updated });
  }
  const announcement = await repo.createAnnouncement(input);
  return noStore({ ok: true, announcement }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = announcementManageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  if (parsed.data.action === "delete") {
    const deleted = await repo.deleteAnnouncement(parsed.data.id);
    return deleted
      ? noStore({ ok: true })
      : NextResponse.json({ ok: false, error: "Announcement not found." }, { status: 404 });
  }
  const statusMap = { publish: "published", unpublish: "draft", archive: "archived" } as const;
  const ok = await repo.setAnnouncementStatus(parsed.data.id, statusMap[parsed.data.action]);
  return ok
    ? noStore({ ok: true })
    : NextResponse.json({ ok: false, error: "Announcement not found." }, { status: 404 });
}
