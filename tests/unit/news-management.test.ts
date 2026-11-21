import { beforeEach, describe, expect, it, vi } from "vitest";
import { JsonRepository } from "@/lib/store";
import type { NewsArticleInput } from "@/lib/store";
import type { ManagedNewsSource, NewsAutomationSettings } from "@/lib/types";
import {
  canonicalNewsUrl,
  checkNewsQuality,
  decideIngestStatus,
  newsDuplicateKey,
  newsFingerprint,
  refreshManagedNews,
  isSameSite,
} from "@/lib/news-service";
import {
  newsArticleInputSchema,
  newsSourceActionSchema,
  newsSourceInputSchema,
} from "@/lib/validation";

function memoryRepo() {
  return new JsonRepository(null, "memory");
}

function articleInput(overrides: Partial<NewsArticleInput> = {}): NewsArticleInput {
  return {
    slug: "test-story-1234abcd",
    title: "सड़क परियोजना शुरू",
    titleHi: "सड़क परियोजना शुरू",
    titleEn: null,
    shortDescription: "शहर में सड़क परियोजना शुरू हुई और निवासियों को राहत मिली।",
    summaryHi: "शहर में सड़क परियोजना शुरू हुई और निवासियों को राहत मिली।",
    summaryEn: null,
    content: "पूरी खबर का सारांश यहाँ है।",
    category: "roads",
    language: "hi",
    sourceName: "Test Source",
    sourceUrl: "https://example.gov.in/story",
    originalUrl: "https://example.gov.in/story",
    status: "draft",
    ...overrides,
  };
}

function sourceInput(overrides = {}) {
  return {
    name: "Test Source",
    feedUrl: "https://example.gov.in/feed.xml",
    language: "hi" as const,
    scope: "national" as const,
    enabled: true,
    attribution: "स्रोत: Test Source",
    termsNote: "Test feed terms.",
    category: "national",
    ...overrides,
  };
}

function trustedSource(overrides: Partial<ManagedNewsSource> = {}): ManagedNewsSource {
  return {
    id: "src-1",
    name: "Trusted Source",
    feedUrl: "https://example.gov.in/feed.xml",
    language: "hi",
    scope: "national",
    enabled: true,
    attribution: "स्रोत: Trusted Source",
    termsNote: "Terms",
    lastFetchedAt: null,
    category: "national",
    trustStatus: "trusted",
    approvalPolicy: "auto_publish",
    autoPublish: true,
    lastError: null,
    lastSuccessAt: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function settings(overrides: Partial<NewsAutomationSettings> = {}): NewsAutomationSettings {
  return {
    autoPublishEnabled: true,
    fetchEnabled: true,
    defaultLanguage: "hi",
    timezone: "Asia/Kolkata",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("news repository", () => {
  let repo: JsonRepository;
  beforeEach(() => {
    repo = memoryRepo();
  });

  it("creates, updates, lists and deletes articles", async () => {
    const created = await repo.createNewsArticle(articleInput());
    expect(created.status).toBe("draft");
    expect(created.title.hi).toBe("सड़क परियोजना शुरू");

    const page = await repo.listNewsArticles({ status: "draft" });
    expect(page.total).toBe(1);
    expect(page.articles[0]?.id).toBe(created.id);

    const updated = await repo.updateNewsArticle(created.id, {
      status: "published",
      breaking: true,
      tags: ["roads", "lucknow"],
    });
    expect(updated?.status).toBe("published");
    expect(updated?.breaking).toBe(true);
    expect(updated?.tags).toEqual(["roads", "lucknow"]);

    expect(await repo.deleteNewsArticle(created.id)).toBe(true);
    expect(await repo.getNewsArticle(created.id)).toBeNull();
  });

  it("detects duplicates by canonical URL key", async () => {
    const key = newsDuplicateKey(null, "https://example.gov.in/story?utm_source=x", "Title", "Summary");
    await repo.createNewsArticle(
      articleInput({
        slug: "first-1234abcd",
        originalUrl: "https://example.gov.in/story",
        duplicateKey: key,
      }),
    );
    const found = await repo.getNewsArticleByDuplicateKey(key);
    expect(found?.slug).toBe("first-1234abcd");
    expect(await repo.getNewsArticleByDuplicateKey("different-key")).toBeNull();

    await expect(
      repo.createNewsArticle(
        articleInput({
          slug: "second-1234abcd",
          originalUrl: "https://example.gov.in/story",
          duplicateKey: key,
        }),
      ),
    ).rejects.toThrow(/duplicate/i);
  });

  it("publishes scheduled articles once and only after their time", async () => {
    const article = await repo.createNewsArticle(
      articleInput({ slug: "scheduled-1234abcd", status: "scheduled", publishAt: "2026-11-20T10:00:00.000Z" }),
    );

    expect(await repo.publishDueNews("2026-11-20T09:59:00.000Z")).toBe(0);
    expect((await repo.getNewsArticle(article.id))?.status).toBe("scheduled");

    expect(await repo.publishDueNews("2026-11-20T10:00:00.000Z")).toBe(1);
    expect((await repo.getNewsArticle(article.id))?.status).toBe("published");

    // Idempotent: a second run cannot publish the same article again.
    expect(await repo.publishDueNews("2026-11-20T11:00:00.000Z")).toBe(0);
  });

  it("cancels a schedule without deleting the article", async () => {
    const article = await repo.createNewsArticle(
      articleInput({ slug: "cancel-1234abcd", status: "scheduled", publishAt: "2026-11-20T10:00:00.000Z" }),
    );
    const updated = await repo.setNewsArticleStatus(article.id, "draft", { clearPublishAt: true });
    expect(updated?.status).toBe("draft");
    expect(updated?.publishAt).toBeNull();
  });

  it("forces revoked sources to stop auto-publishing", async () => {
    const source = await repo.createManagedNewsSource(sourceInput());
    expect(source.trustStatus).toBe("untrusted");
    expect(source.approvalPolicy).toBe("manual");
    expect(source.autoPublish).toBe(false);

    await repo.updateManagedNewsSource(source.id, {
      trustStatus: "trusted",
      approvalPolicy: "auto_publish",
      autoPublish: true,
    });
    const revoked = await repo.updateManagedNewsSource(source.id, { trustStatus: "revoked" });
    expect(revoked?.autoPublish).toBe(false);
    expect(revoked?.approvalPolicy).toBe("manual");
  });

  it("keeps approval history with actor and timestamp", async () => {
    const article = await repo.createNewsArticle(articleInput());
    const entry = await repo.addNewsApproval({
      articleId: article.id,
      action: "approved_published",
      actor: "admin",
      note: "checked",
    });
    expect(entry.actor).toBe("admin");
    expect(entry.action).toBe("approved_published");
    const history = await repo.listNewsApprovals(article.id);
    expect(history).toHaveLength(1);
  });
});

describe("news ingestion policy", () => {
  it("only auto-publishes a trusted source with the explicit policy and clean checks", () => {
    const clean = { ok: true, issues: [] };
    expect(decideIngestStatus(trustedSource(), settings(), clean).status).toBe("published");

    expect(decideIngestStatus(trustedSource(), settings({ autoPublishEnabled: false }), clean).status).toBe("pending");
    expect(decideIngestStatus(trustedSource({ trustStatus: "untrusted" }), settings(), clean).status).toBe("pending");
    expect(decideIngestStatus(trustedSource({ approvalPolicy: "manual" }), settings(), clean).status).toBe("pending");
    expect(decideIngestStatus(trustedSource({ approvalPolicy: "fetch_only" }), settings(), clean).status).toBe("pending");
    expect(decideIngestStatus(trustedSource({ autoPublish: false }), settings(), clean).status).toBe("pending");
    expect(decideIngestStatus(trustedSource(), settings(), { ok: false, issues: ["summary too short"] }).status).toBe("pending");
  });

  it("rejects incomplete or placeholder content", () => {
    expect(checkNewsQuality({ title: "Short", summary: "too short", link: "https://example.com/a" }).ok).toBe(false);
    expect(checkNewsQuality({ title: "A valid headline here", summary: "x".repeat(60), link: "javascript:alert(1)" }).ok).toBe(false);
    expect(checkNewsQuality({ title: "Test story placeholder", summary: "x".repeat(60), link: "https://example.com/a" }).ok).toBe(false);
    expect(checkNewsQuality({ title: "A valid headline here", summary: "x".repeat(60), link: "https://example.com/a" }).ok).toBe(true);
  });

  it("normalises attribution URLs and fingerprints content", () => {
    expect(canonicalNewsUrl("https://Example.com/story/?utm_source=x&b=2&a=1#top")).toBe(
      "https://example.com/story?a=1&b=2",
    );
    expect(canonicalNewsUrl("javascript:alert(1)")).toBeNull();
    const first = newsFingerprint("शीर्षक", "सारांश");
    const second = newsFingerprint("  शीर्षक  ", "सारांश!");
    expect(first).toBe(second);
  });

  it("only enriches same-site article links", () => {
    expect(isSameSite("https://pib.gov.in/a", "https://www.pib.gov.in/feed")).toBe(true);
    expect(isSameSite("https://example.gov.in/a", "https://other.gov.in/feed")).toBe(false);
    expect(isSameSite("javascript:alert(1)", "https://example.gov.in/feed")).toBe(false);
    expect(isSameSite("not a url", "https://example.gov.in/feed")).toBe(false);
  });

  it("ingests an RSS feed, publishes trusted items and deduplicates on retry", async () => {
    const repo = memoryRepo();
    await repo.updateNewsAutomationSettings({ autoPublishEnabled: true, fetchEnabled: true });
    const source = await repo.createManagedNewsSource(sourceInput());
    await repo.updateManagedNewsSource(source.id, {
      trustStatus: "trusted",
      approvalPolicy: "auto_publish",
      autoPublish: true,
    });

    const storyLink = "https://example.gov.in/story-one";
    const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>शहर में नई सड़क परियोजना शुरू हुई</title>
        <link>${storyLink}?utm_source=rss</link>
        <description>नगर निगम ने सोमवार को नई सड़क परियोजना का काम शुरू किया, जिससे कई वार्डों को राहत मिलेगी।</description>
        <pubDate>Wed, 19 Nov 2026 10:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;
    const fetchMock = vi.fn(async () => new Response(rss, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await refreshManagedNews({ repo });
    expect(first.errors).toEqual([]);
    expect(first.created).toBe(1);
    expect(first.published).toBe(1);

    const { articles } = await repo.listNewsArticles({});
    expect(articles).toHaveLength(1);
    expect(articles[0]?.status).toBe("published");
    expect(articles[0]?.originalUrl).toBe("https://example.gov.in/story-one");

    const second = await refreshManagedNews({ repo });
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);
    expect((await repo.listNewsArticles({})).articles).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it("keeps untrusted-source items pending even when global auto-publish is on", async () => {
    const repo = memoryRepo();
    await repo.updateNewsAutomationSettings({ autoPublishEnabled: true, fetchEnabled: true });
    const source = await repo.createManagedNewsSource(sourceInput());
    // New sources are untrusted/manual by construction; do not approve.

    const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>सरकारी योजना का नया अपडेट जारी</title>
        <link>https://example.gov.in/story-two</link>
        <description>सरकार ने योजना के नए दिशानिर्देश जारी किए हैं जिससे अधिक लोगों को लाभ मिलेगा।</description>
      </item>
    </channel></rss>`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(rss, { status: 200 })));

    const result = await refreshManagedNews({ repo });
    expect(result.created).toBe(1);
    expect(result.published).toBe(0);
    const { articles } = await repo.listNewsArticles({});
    expect(articles[0]?.status).toBe("pending");
    expect(articles[0]?.sourceId).toBe(source.id);

    vi.unstubAllGlobals();
  });

  it("enriches a title-only trusted feed from the same-site article page", async () => {
    const repo = memoryRepo();
    await repo.updateNewsAutomationSettings({ autoPublishEnabled: true, fetchEnabled: true });
    const source = await repo.createManagedNewsSource(sourceInput());
    await repo.updateManagedNewsSource(source.id, {
      trustStatus: "trusted",
      approvalPolicy: "auto_publish",
      autoPublish: true,
    });

    const articleUrl = "https://example.gov.in/press/story-three";
    const paragraph =
      "नगर निगम ने सोमवार को नई सड़क परियोजना का काम शुरू किया, जिससे कई वार्डों के निवासियों को आवागमन में राहत मिलेगी।";
    const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>शहर में नई सड़क परियोजना शुरू हुई</title>
        <link>${articleUrl}</link>
      </item>
    </channel></rss>`;
    const articleHtml = `<html><head><title>Press release</title></head><body>
      <div id="PdfDiv"><p>${paragraph}</p><p>${paragraph}</p></div>
    </body></html>`;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("feed.xml")) return new Response(rss, { status: 200 });
      return new Response(articleHtml, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshManagedNews({ repo });
    expect(result.errors).toEqual([]);
    expect(result.created).toBe(1);
    expect(result.published).toBe(1);

    const { articles } = await repo.listNewsArticles({});
    expect(articles[0]?.status).toBe("published");
    expect(articles[0]?.shortDescription.length).toBeGreaterThanOrEqual(40);
    expect(articles[0]?.shortDescription).toContain("नई सड़क परियोजना");

    const approvals = await repo.listNewsApprovals(articles[0]!.id);
    expect(approvals.some((entry) => /summary from article page/.test(entry.note ?? ""))).toBe(true);
    // One feed request plus exactly one bounded article-page request.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });

  it("never reads article pages for untrusted sources", async () => {
    const repo = memoryRepo();
    await repo.updateNewsAutomationSettings({ autoPublishEnabled: true, fetchEnabled: true });
    await repo.createManagedNewsSource(sourceInput());

    const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>सरकारी योजना का नया अपडेट जारी</title>
        <link>https://example.gov.in/story-four</link>
      </item>
    </channel></rss>`;
    const fetchMock = vi.fn(async () => new Response(rss, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshManagedNews({ repo });
    expect(result.created).toBe(1);
    expect(result.published).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("records a failed fetch without throwing", async () => {
    const repo = memoryRepo();
    await repo.createManagedNewsSource(sourceInput());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );

    const result = await refreshManagedNews({ repo });
    expect(result.errors.join(" ")).toContain("timeout");
    const logs = await repo.listNewsFetchLogs();
    expect(logs[0]?.status).toBe("failed");

    vi.unstubAllGlobals();
  });
});

describe("news validation", () => {
  it("accepts a complete article and rejects unsafe URLs", () => {
    const valid = newsArticleInputSchema.safeParse({
      title: "शहर में नई सड़क परियोजना शुरू हुई",
      shortDescription: "नगर निगम ने नई सड़क परियोजना का काम शुरू किया है।",
      content: "विस्तृत सारांश।",
      imageUrl: "https://example.com/image.jpg",
      imageAlt: "सड़क",
      category: "roads",
      tags: ["roads"],
      author: "Reporter",
      sourceName: "Kya Bolti Public",
      sourceUrl: "https://example.com/story",
      originalUrl: "https://example.com/story",
      language: "hi",
      featured: true,
      breaking: false,
      seoTitle: "सड़क परियोजना",
      seoDescription: "परियोजना का विवरण।",
      status: "published",
    });
    expect(valid.success).toBe(true);

    const unsafe = newsArticleInputSchema.safeParse({
      title: "शहर में नई सड़क परियोजना शुरू हुई",
      shortDescription: "नगर निगम ने नई सड़क परियोजना का काम शुरू किया है।",
      imageUrl: "javascript:alert(1)",
      category: "roads",
      sourceName: "Kya Bolti Public",
      language: "hi",
    });
    expect(unsafe.success).toBe(false);
  });

  it("validates source and action payloads", () => {
    expect(
      newsSourceInputSchema.safeParse({
        name: "PIB",
        feedUrl: "https://www.pib.gov.in/feed.xml",
        language: "hi",
        scope: "national",
        attribution: "स्रोत: PIB",
        termsNote: "सरकारी फ़ीड",
      }).success,
    ).toBe(true);
    expect(newsSourceActionSchema.safeParse({ id: "pib-hindi", action: "approve" }).success).toBe(true);
    expect(newsSourceActionSchema.safeParse({ id: "pib-hindi", action: "destroy" }).success).toBe(false);
  });
});
