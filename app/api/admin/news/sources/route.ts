import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { newsSourceActionSchema, newsSourceInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  const [sources, stats] = await Promise.all([
    repo.listManagedNewsSources(),
    repo.getNewsStats(),
  ]);
  return noStore({ ok: true, sources, stats });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsSourceInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const data = parsed.data;

  if (data.id) {
    const existing = await repo.getManagedNewsSource(data.id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Source not found." }, { status: 404 });
    }
    const feedChanged = data.feedUrl !== existing.feedUrl;
    const updated = await repo.updateManagedNewsSource(data.id, {
      name: data.name,
      feedUrl: data.feedUrl,
      language: data.language,
      scope: data.scope,
      enabled: data.enabled ?? existing.enabled,
      attribution: data.attribution,
      termsNote: data.termsNote,
      category: data.category,
      // Pointing an approved source at a different feed invalidates the
      // previous review. Force re-approval instead of inheriting trust.
      trustStatus: feedChanged ? "untrusted" : data.trustStatus,
      approvalPolicy: feedChanged ? "manual" : data.approvalPolicy,
      autoPublish: feedChanged ? false : data.autoPublish,
    });
    return noStore({ ok: true, source: updated });
  }

  const source = await repo.createManagedNewsSource({
    name: data.name,
    feedUrl: data.feedUrl,
    language: data.language,
    scope: data.scope,
    enabled: data.enabled ?? false,
    attribution: data.attribution,
    termsNote: data.termsNote,
    category: data.category,
    // New sources always start untrusted with manual approval, regardless of
    // what the client sends. Trust must be granted explicitly.
    trustStatus: "untrusted",
    approvalPolicy: "manual",
    autoPublish: false,
  });
  return noStore({ ok: true, source }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsSourceActionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const source = await repo.getManagedNewsSource(parsed.data.id);
  if (!source) {
    return NextResponse.json({ ok: false, error: "Source not found." }, { status: 404 });
  }

  if (parsed.data.action === "delete") {
    const deleted = await repo.deleteManagedNewsSource(source.id);
    return deleted
      ? noStore({ ok: true })
      : NextResponse.json({ ok: false, error: "Source not found." }, { status: 404 });
  }

  let patch: Parameters<typeof repo.updateManagedNewsSource>[1];
  switch (parsed.data.action) {
    case "approve":
      patch = { trustStatus: "trusted", enabled: true, lastError: null };
      break;
    case "revoke":
      patch = {
        trustStatus: "revoked",
        autoPublish: false,
        approvalPolicy: source.approvalPolicy === "fetch_only" ? "fetch_only" : "manual",
      };
      break;
    case "enable":
      patch = { enabled: true };
      break;
    case "disable":
      patch = { enabled: false };
      break;
    default:
      return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
  }

  const updated = await repo.updateManagedNewsSource(source.id, patch);
  return noStore({ ok: true, source: updated });
}
