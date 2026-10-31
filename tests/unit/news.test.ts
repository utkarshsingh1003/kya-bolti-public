import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoNews } from "@/data/news";
import { __resetNewsCache, __setNewsCache, getNews } from "@/lib/news";
import type { NewsArticle } from "@/lib/types";

const sampleArticle: NewsArticle = {
  id: "test-1",
  title: { hi: "परीक्षण खबर", en: "Test story" },
  summary: { hi: "सारांश", en: "Summary" },
  category: "state",
  stateId: "up",
  districtId: "up-lucknow",
  sourceName: "Test source",
  sourceUrl: "https://example.gov.in/story",
  publishedAt: "2026-10-01T10:00:00.000Z",
  language: "hi",
  isDemo: false,
  lastVerifiedAt: "2026-10-01T10:00:00.000Z",
};

const rss = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
  <title>Test feed</title>
  <item>
    <title>सड़क &amp; पानी की परियोजना</title>
    <link>https://example.gov.in/story</link>
    <description><![CDATA[<p>शहर में सड़क परियोजना शुरू हुई।</p>]]></description>
    <pubDate>Wed, 01 Oct 2026 10:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Unsafe link</title>
    <link>javascript:alert(1)</link>
    <description>Should be dropped</description>
  </item>
</channel></rss>`;

beforeEach(() => {
  __resetNewsCache();
});

describe("getNews", () => {
  it("returns clearly labelled demo news without fetching when live news is disabled", async () => {
    vi.stubEnv("KBP_DISABLE_LIVE_NEWS", "1");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getNews();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.isLive).toBe(false);
    expect(result.articles).toBe(demoNews);
    expect(result.errors.join(" ")).toContain("KBP_DISABLE_LIVE_NEWS");
  });

  it("parses a permitted RSS feed, decodes entities and drops unsafe links", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => rss,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getNews();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.isLive).toBe(true);
    expect(result.articles).toHaveLength(1);
    const article = result.articles[0]!;
    expect(article.title.hi).toBe("सड़क & पानी की परियोजना");
    expect(article.summary.hi).toBe("शहर में सड़क परियोजना शुरू हुई।");
    expect(article.category).toBe("roads");
    expect(article.sourceUrl).toBe("https://example.gov.in/story");
    expect(article.publishedAt).toBe("2026-10-01T10:00:00.000Z");
    expect(article.isDemo).toBe(false);
  });

  it("falls back to demo news when every feed fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await getNews();

    expect(result.isLive).toBe(false);
    expect(result.articles).toBe(demoNews);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("serves a cached live snapshot without refetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    __setNewsCache([sampleArticle]);

    const result = await getNews();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.isLive).toBe(true);
    expect(result.articles).toEqual([sampleArticle]);
  });
});
