import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import {
  newsArticleInputSchema,
  newsArticleManageSchema,
  newsStatusValues,
} from "@/lib/validation";
import { newsDuplicateKey, newsFingerprint, uniqueNewsSlug } from "@/lib/news-service";
import type { NewsArticleRecord, NewsStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ADMIN_ACTOR = "admin";

function isoOrNull(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const repo = await getRepository();
  const scheduled = await repo.publishDueNews();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const statusRaw = url.searchParams.get("status");
  const status =
    statusRaw && (newsStatusValues as readonly string[]).includes(statusRaw)
      ? (statusRaw as NewsStatus)
      : undefined;
  const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20") || 20, 1), 100);
  const category = url.searchParams.get("category") ?? undefined;
  const sourceId = url.searchParams.get("sourceId") ?? undefined;
  const languageRaw = url.searchParams.get("language");
  const language = languageRaw === "hi" || languageRaw === "en" ? languageRaw : undefined;
  const sortRaw = url.searchParams.get("sort");
  const sort = sortRaw === "oldest" || sortRaw === "publish_at" ? sortRaw : "newest";

  const [list, stats, sources, categories, settings, logs] = await Promise.all([
    repo.listNewsArticles({
      status,
      category,
      sourceId,
      language,
      query: url.searchParams.get("q") ?? undefined,
      sort,
      limit,
      offset: (page - 1) * limit,
    }),
    repo.getNewsStats(),
    repo.listManagedNewsSources(),
    repo.listNewsCategories(),
    repo.getNewsAutomationSettings(),
    repo.listNewsFetchLogs(30),
  ]);

  if (id) {
    const [article, approvals] = await Promise.all([
      repo.getNewsArticle(id),
      repo.listNewsApprovals(id),
    ]);
    if (!article) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }
    return noStore({ ok: true, article, approvals });
  }

  return noStore({
    ok: true,
    articles: list.articles,
    total: list.total,
    page,
    limit,
    stats,
    sources,
    categories,
    settings,
    logs,
    publishedBySchedule: scheduled,
  });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsArticleInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;
  const repo = await getRepository();
  const now = new Date().toISOString();

  const scheduledAt = isoOrNull(data.scheduledAt || data.publishAt);
  if (data.status === "scheduled" && !scheduledAt) {
    return NextResponse.json(
      { ok: false, error: "A scheduled article needs a publish date and time." },
      { status: 400 },
    );
  }
  if (data.status === "published" && !data.content?.trim() && !data.originalUrl && !data.sourceUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Add article content or an original article URL before publishing. We do not publish empty summaries.",
      },
      { status: 400 },
    );
  }

  const publishAt =
    data.status === "published"
      ? scheduledAt && new Date(scheduledAt).getTime() <= Date.now()
        ? scheduledAt
        : now
      : data.status === "scheduled"
        ? scheduledAt
        : null;
  const publishedAt = data.status === "published" ? now : null;

  if (data.id) {
    const existing = await repo.getNewsArticle(data.id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }
    let updated: NewsArticleRecord | null;
    try {
      updated = await repo.updateNewsArticle(data.id, {
        slug: existing.slug,
        title: data.title,
        titleHi: data.language === "hi" ? data.title : null,
        titleEn: data.language === "en" ? data.title : null,
        shortDescription: data.shortDescription,
        summaryHi: data.language === "hi" ? data.shortDescription : null,
        summaryEn: data.language === "en" ? data.shortDescription : null,
        content: data.content ?? "",
        imageUrl: data.imageUrl || null,
        imageAlt: data.imageAlt || null,
        category: data.category,
        tags: data.tags ?? [],
        author: data.author || null,
        sourceName: data.sourceName,
        sourceUrl: data.sourceUrl || null,
        originalUrl: data.originalUrl || null,
        language: data.language,
        featured: data.featured ?? false,
        breaking: data.breaking ?? false,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishAt,
        publishedAt: data.status === "published" ? existing.publishedAt ?? publishedAt : existing.publishedAt,
        approvedBy: data.status === "published" ? ADMIN_ACTOR : existing.approvedBy,
        approvedAt: data.status === "published" ? existing.approvedAt ?? now : existing.approvedAt,
        fingerprint: newsFingerprint(data.title, data.shortDescription),
        duplicateKey:
          data.originalUrl || data.sourceUrl
            ? newsDuplicateKey(null, data.originalUrl || data.sourceUrl || null, data.title, data.shortDescription)
            : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if ((error as { code?: string }).code === "23505" || /duplicate|unique/i.test(message)) {
        return NextResponse.json(
          { ok: false, error: "Another article already uses this original URL." },
          { status: 409 },
        );
      }
      throw error;
    }
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }
    await repo.addNewsApproval({
      articleId: updated.id,
      action: "updated",
      actor: ADMIN_ACTOR,
      note: `status=${updated.status}`,
    });
    return noStore({ ok: true, article: updated });
  }

  if (data.originalUrl || data.sourceUrl) {
    const key = newsDuplicateKey(null, data.originalUrl || data.sourceUrl || null, data.title, data.shortDescription);
    const duplicate = await repo.getNewsArticleByDuplicateKey(key);
    if (duplicate) {
      return NextResponse.json(
        {
          ok: false,
          error: "An article with this original URL already exists.",
          articleId: duplicate.id,
        },
        { status: 409 },
      );
    }
  }

  const id = randomUUID();
  const slug = await uniqueNewsSlug(repo, data.title, id);
  let created: NewsArticleRecord;
  try {
    created = await repo.createNewsArticle({
      id,
      slug,
      title: data.title,
      titleHi: data.language === "hi" ? data.title : null,
      titleEn: data.language === "en" ? data.title : null,
      shortDescription: data.shortDescription,
      summaryHi: data.language === "hi" ? data.shortDescription : null,
      summaryEn: data.language === "en" ? data.shortDescription : null,
      content: data.content ?? "",
      imageUrl: data.imageUrl || null,
      imageAlt: data.imageAlt || null,
      category: data.category,
      tags: data.tags ?? [],
      author: data.author || null,
      sourceName: data.sourceName,
      sourceUrl: data.sourceUrl || null,
      originalUrl: data.originalUrl || null,
      language: data.language,
      featured: data.featured ?? false,
      breaking: data.breaking ?? false,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      status: data.status,
      publishAt,
      publishedAt,
      fetchedAt: now,
      fingerprint: newsFingerprint(data.title, data.shortDescription),
      duplicateKey: data.originalUrl || data.sourceUrl
        ? newsDuplicateKey(null, data.originalUrl || data.sourceUrl || null, data.title, data.shortDescription)
        : null,
      approvedBy: data.status === "published" ? ADMIN_ACTOR : null,
      approvedAt: data.status === "published" ? now : null,
      isDemo: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if ((error as { code?: string }).code === "23505" || /duplicate|unique/i.test(message)) {
      return NextResponse.json(
        { ok: false, error: "This article was already submitted (duplicate URL or content)." },
        { status: 409 },
      );
    }
    throw error;
  }
  await repo.addNewsApproval({
    articleId: created.id,
    action: "created",
    actor: ADMIN_ACTOR,
    note: `status=${created.status}`,
  });
  return noStore({ ok: true, article: created }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsArticleManageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { id, action } = parsed.data;
  const repo = await getRepository();
  const article = await repo.getNewsArticle(id);
  if (!article) {
    return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
  }
  const now = new Date().toISOString();
  const note = parsed.data.note || null;

  if (action === "delete") {
    await repo.addNewsApproval({ articleId: id, action: "deleted", actor: ADMIN_ACTOR, note });
    const deleted = await repo.deleteNewsArticle(id);
    return deleted
      ? noStore({ ok: true })
      : NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
  }

  if (action === "feature" || action === "unfeature" || action === "breaking" || action === "unbreaking") {
    const updated = await repo.updateNewsArticle(id, {
      featured: action === "feature" ? true : action === "unfeature" ? false : article.featured,
      breaking: action === "breaking" ? true : action === "unbreaking" ? false : article.breaking,
    });
    await repo.addNewsApproval({ articleId: id, action, actor: ADMIN_ACTOR, note });
    return noStore({ ok: true, article: updated });
  }

  if (action === "schedule" || action === "approve_schedule") {
    const when = isoOrNull(parsed.data.publishAt);
    if (!when) {
      return NextResponse.json({ ok: false, error: "Choose a valid publish date and time." }, { status: 400 });
    }
    if (new Date(when).getTime() <= Date.now()) {
      const published = await repo.setNewsArticleStatus(id, "published", {
        publishedAt: now,
        approvedBy: ADMIN_ACTOR,
      });
      await repo.addNewsApproval({
        articleId: id,
        action: "published",
        actor: ADMIN_ACTOR,
        note: "Scheduled time was already in the past; published immediately.",
      });
      return noStore({ ok: true, article: published, publishedImmediately: true });
    }
    const updated = await repo.setNewsArticleStatus(id, "scheduled", {
      publishAt: when,
      approvedBy: ADMIN_ACTOR,
    });
    await repo.addNewsApproval({
      articleId: id,
      action: action === "approve_schedule" ? "approved_scheduled" : "scheduled",
      actor: ADMIN_ACTOR,
      note: when,
    });
    return noStore({ ok: true, article: updated });
  }

  if (action === "cancel_schedule") {
    const updated = await repo.setNewsArticleStatus(id, "draft", { clearPublishAt: true });
    await repo.addNewsApproval({ articleId: id, action: "schedule_cancelled", actor: ADMIN_ACTOR, note });
    return noStore({ ok: true, article: updated });
  }

  if (action === "unpublish") {
    const updated = await repo.setNewsArticleStatus(id, "draft");
    await repo.addNewsApproval({ articleId: id, action: "unpublished", actor: ADMIN_ACTOR, note });
    return noStore({ ok: true, article: updated });
  }

  if (action === "reject") {
    const updated = await repo.setNewsArticleStatus(id, "rejected", {
      reason: note || "Rejected by admin",
    });
    await repo.addNewsApproval({ articleId: id, action: "rejected", actor: ADMIN_ACTOR, note });
    return noStore({ ok: true, article: updated });
  }

  if (action === "approve" || action === "publish") {
    if (!article.content.trim() && !article.originalUrl && !article.sourceUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "Add content or an original article URL before publishing this article.",
        },
        { status: 400 },
      );
    }
    const updated = await repo.setNewsArticleStatus(id, "published", {
      publishedAt: now,
      approvedBy: ADMIN_ACTOR,
    });
    await repo.addNewsApproval({
      articleId: id,
      action: action === "approve" ? "approved_published" : "published",
      actor: ADMIN_ACTOR,
      note,
    });
    return noStore({ ok: true, article: updated });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
}
