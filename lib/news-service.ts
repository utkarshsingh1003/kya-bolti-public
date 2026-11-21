import { createHash, randomUUID } from "crypto";
import type {
  ManagedNewsSource,
  NewsAutomationSettings,
} from "@/lib/types";
import type { NewsArticleInput, Repository } from "@/lib/store";
import { getRepository } from "@/lib/store";
import { classifyNewsCategory, fetchArticleExcerpt, fetchFeedItems, type ParsedFeedItem } from "@/lib/news";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
];

/** Normalise an article URL so tracking parameters cannot create duplicates. */
export function canonicalNewsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
    const sorted = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    url.search = "";
    for (const [key, value] of sorted) url.searchParams.append(key, value);
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function newsFingerprint(title: string, summary: string): string {
  const normalised = `${title} ${summary}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalised).digest("hex");
}

/** Stable idempotency key: canonical URL when possible, otherwise content hash. */
export function newsDuplicateKey(
  sourceId: string | null,
  link: string | null,
  title: string,
  summary: string,
): string {
  const canonical = canonicalNewsUrl(link);
  const basis = canonical ?? `${sourceId ?? "manual"}:${newsFingerprint(title, summary)}`;
  return createHash("sha256").update(basis).digest("hex");
}

const HINDI_RE = /[\u0900-\u097F]/;

export function newsSlug(title: string, id: string = randomUUID()): string {
  const ascii = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  const base = ascii || (HINDI_RE.test(title) ? "khabar" : "news");
  return `${base}-${id.slice(0, 8)}`;
}

export type NewsQualityCheck = { ok: boolean; issues: string[] };

/** Metadata and content checks applied before any automatic publication. */
export function checkNewsQuality(item: {
  title: string;
  summary: string;
  link: string | null;
}): NewsQualityCheck {
  const issues: string[] = [];
  const title = item.title.trim();
  const summary = item.summary.trim();
  if (title.length < 10) issues.push("title too short");
  if (title.length > 220) issues.push("title too long");
  if (!canonicalNewsUrl(item.link)) issues.push("invalid article URL");
  if (summary.length < MIN_SUMMARY_CHARS) issues.push("summary too short");
  if (summary.length > 2000) issues.push("summary too long");
  if (/^(test|sample|demo|lorem ipsum)\b/i.test(title)) issues.push("placeholder content");
  if (!/\p{L}/u.test(title)) issues.push("title has no letters");
  return { ok: issues.length === 0, issues };
}

export type IngestDecision = {
  status: "pending" | "published";
  reason: string;
};

/**
 * Source approval is never unconditional. Auto-publication requires the global
 * toggle, a trusted source, the explicit auto-publish policy, the per-source
 * toggle and a clean quality check — in that order.
 */
export function decideIngestStatus(
  source: ManagedNewsSource,
  settings: NewsAutomationSettings,
  quality: NewsQualityCheck,
): IngestDecision {
  if (!settings.autoPublishEnabled) return { status: "pending", reason: "global auto-publish is off" };
  if (source.trustStatus !== "trusted") return { status: "pending", reason: "source is not trusted" };
  if (source.approvalPolicy !== "auto_publish") {
    return { status: "pending", reason: "source policy is manual or fetch-only" };
  }
  if (!source.autoPublish) return { status: "pending", reason: "source auto-publish is off" };
  if (!source.enabled) return { status: "pending", reason: "source is disabled" };
  if (!quality.ok) return { status: "pending", reason: quality.issues.join(", ") };
  return { status: "published", reason: "trusted source with auto-publish and passing checks" };
}

export type IngestResult = {
  sources: number;
  found: number;
  created: number;
  published: number;
  skipped: number;
  errors: string[];
  enabled: boolean;
};

/** Minimum summary length enforced by `checkNewsQuality`. */
export const MIN_SUMMARY_CHARS = 40;
/** Hard cap on article-page reads per source per run (feed politeness). */
export const MAX_EXCERPTS_PER_FETCH = 5;

/** True when both URLs belong to the same site, ignoring a `www.` prefix. */
export function isSameSite(articleUrl: string, feedUrl: string): boolean {
  try {
    const article = new URL(articleUrl);
    const feed = new URL(feedUrl);
    const httpish = (url: URL) => url.protocol === "https:" || url.protocol === "http:";
    if (!httpish(article) || !httpish(feed)) return false;
    const normalise = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
    return normalise(article.hostname) === normalise(feed.hostname);
  } catch {
    return false;
  }
}

/**
 * A source is eligible for automatic publication only when every policy gate
 * in `decideIngestStatus` is open. Used to decide whether a missing feed
 * summary may be enriched from the same site's article page.
 */
export function sourceMayAutoPublish(
  source: ManagedNewsSource,
  settings: NewsAutomationSettings,
): boolean {
  return Boolean(
    settings.autoPublishEnabled &&
      source.enabled &&
      source.trustStatus === "trusted" &&
      source.approvalPolicy === "auto_publish" &&
      source.autoPublish,
  );
}

export async function uniqueNewsSlug(repo: Repository, title: string, id: string): Promise<string> {
  const base = newsSlug(title, id);
  if (!(await repo.getNewsArticleBySlug(base))) return base;
  return `${base}-${id.slice(0, 4)}`;
}

function buildArticleInput(
  source: ManagedNewsSource,
  item: ParsedFeedItem,
  decision: IngestDecision,
  slug: string,
  duplicateKey: string,
  fingerprint: string,
  now: string,
  defaultLanguage: "hi" | "en",
): NewsArticleInput {
  const language = source.language ?? defaultLanguage;
  const title = item.title.trim();
  const summary = item.summary.trim() || title;
  const publishedAt = decision.status === "published" ? now : null;
  return {
    slug,
    title,
    titleHi: language === "hi" ? title : null,
    titleEn: language === "en" ? title : null,
    shortDescription: summary.slice(0, 600),
    summaryHi: language === "hi" ? summary.slice(0, 600) : null,
    summaryEn: language === "en" ? summary.slice(0, 600) : null,
    content: "",
    category: classifyNewsCategory(title, summary),
    tags: [],
    author: source.name,
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: canonicalNewsUrl(item.link) ?? item.link,
    originalUrl: canonicalNewsUrl(item.link) ?? item.link,
    language,
    featured: false,
    breaking: false,
    status: decision.status,
    publishAt: publishedAt,
    publishedAt,
    fetchedAt: now,
    fingerprint,
    duplicateKey,
    isDemo: false,
  };
}

/**
 * Fetch every enabled source (or one source), deduplicate, apply the source
 * policy and persist the result. Safe to call from a cron job or an admin
 * "fetch now" button; each item is idempotent via `duplicateKey`.
 */
export async function refreshManagedNews(options: {
  sourceId?: string;
  repo?: Repository;
} = {}): Promise<IngestResult> {
  const repo = options.repo ?? (await getRepository());
  const settings = await repo.getNewsAutomationSettings();
  const result: IngestResult = {
    sources: 0,
    found: 0,
    created: 0,
    published: 0,
    skipped: 0,
    errors: [],
    enabled: settings.fetchEnabled,
  };

  if (!settings.fetchEnabled && !options.sourceId) {
    result.errors.push("Automatic fetching is disabled in news automation settings.");
    return result;
  }

  const allSources = await repo.listManagedNewsSources();
  const sources = allSources.filter(
    (source) => source.enabled && (!options.sourceId || source.id === options.sourceId),
  );
  result.sources = sources.length;

  for (const source of sources) {
    const startedAt = new Date().toISOString();
    let items: ParsedFeedItem[] = [];
    try {
      items = await fetchFeedItems(source.feedUrl, 10_000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${source.name}: ${message}`);
      await repo.updateManagedNewsSource(source.id, {
        lastFetchedAt: startedAt,
        lastError: message,
      });
      await repo.createNewsFetchLog({
        sourceId: source.id,
        sourceName: source.name,
        status: "failed",
        itemsFound: 0,
        itemsNew: 0,
        itemsPublished: 0,
        error: message,
        startedAt,
      });
      continue;
    }

    result.found += items.length;
    let created = 0;
    let published = 0;
    let skipped = 0;
    let excerpts = 0;
    let partialError: string | null = null;
    const canEnrich = sourceMayAutoPublish(source, settings);

    for (const item of items.slice(0, 25)) {
      const now = new Date().toISOString();
      const link = canonicalNewsUrl(item.link);
      const duplicateKey = newsDuplicateKey(source.id, link, item.title, item.summary);
      if (!link) {
        skipped += 1;
        continue;
      }
      if (await repo.getNewsArticleByDuplicateKey(duplicateKey)) {
        skipped += 1;
        continue;
      }

      // Feeds such as PIB publish titles without descriptions. For sources
      // that would otherwise auto-publish, read a bounded excerpt from the
      // same site so the quality gate judges real content. Anything else
      // stays pending for a human.
      let feedItem = item;
      let enriched = false;
      if (
        canEnrich &&
        feedItem.summary.trim().length < MIN_SUMMARY_CHARS &&
        excerpts < MAX_EXCERPTS_PER_FETCH &&
        isSameSite(link, source.feedUrl)
      ) {
        excerpts += 1;
        const excerpt = await fetchArticleExcerpt(link, 8000);
        if (excerpt.length > feedItem.summary.trim().length) {
          feedItem = { ...feedItem, summary: excerpt };
          enriched = true;
        }
      }

      const fingerprint = newsFingerprint(feedItem.title, feedItem.summary);
      const quality = checkNewsQuality({ title: feedItem.title, summary: feedItem.summary, link });
      const decision = decideIngestStatus(source, settings, quality);
      const id = randomUUID();
      const slug = await uniqueNewsSlug(repo, feedItem.title, id);
      const input = buildArticleInput(
        source,
        feedItem,
        decision,
        slug,
        duplicateKey,
        fingerprint,
        now,
        settings.defaultLanguage,
      );
      input.id = id;
      try {
        const article = await repo.createNewsArticle(input);
        created += 1;
        if (article.status === "published") published += 1;
        await repo.addNewsApproval({
          articleId: article.id,
          action: article.status === "published" ? "auto_published" : "fetched",
          actor: "system",
          note: `${article.status === "published" ? decision.reason : `Pending: ${decision.reason}`}${
            enriched ? " (summary from article page)" : ""
          }`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if ((error as { code?: string }).code === "23505" || /duplicate|unique/i.test(message)) {
          skipped += 1;
          continue;
        }
        partialError = message;
        result.errors.push(`${source.name}: ${message}`);
      }
    }

    result.created += created;
    result.published += published;
    result.skipped += skipped;

    const status = partialError ? "partial" : "success";
    await repo.updateManagedNewsSource(source.id, {
      lastFetchedAt: new Date().toISOString(),
      lastError: partialError,
      lastSuccessAt: partialError ? source.lastSuccessAt : new Date().toISOString(),
    });
    await repo.createNewsFetchLog({
      sourceId: source.id,
      sourceName: source.name,
      status,
      itemsFound: items.length,
      itemsNew: created,
      itemsPublished: published,
      error: partialError,
      startedAt,
    });
  }

  return result;
}

/** Publish scheduled articles whose time has passed. Idempotent. */
export async function publishScheduledNews(repoOverride?: Repository): Promise<number> {
  const repo = repoOverride ?? (await getRepository());
  return repo.publishDueNews();
}

/** Return an article only when it is publicly visible right now. */
export async function getPublicNewsArticle(slugOrId: string) {
  const repo = await getRepository();
  await repo.publishDueNews();
  const article =
    (await repo.getNewsArticleBySlug(slugOrId)) ?? (await repo.getNewsArticle(slugOrId));
  if (!article || article.status !== "published") return null;
  if (article.publishAt && new Date(article.publishAt).getTime() > Date.now()) return null;
  return article;
}
