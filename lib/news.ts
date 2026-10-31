import { demoNews, newsSources } from "@/data/news";
import type { NewsArticle, NewsCategory } from "@/lib/types";

type CacheEntry = { articles: NewsArticle[]; fetchedAt: number; errors: string[] };

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

const categoryKeywords: { category: NewsCategory; words: RegExp }[] = [
  { category: "roads", words: /सड़क|मार्ग|हाईवे|पुल|flyover|road|highway|pothole/i },
  { category: "water", words: /पानी|जल|बाढ़|बारिश|water|flood|rain|jal/i },
  { category: "health", words: /स्वास्थ्य|अस्पताल|डॉक्टर|health|hospital|medical|vaccine/i },
  { category: "education", words: /शिक्षा|स्कूल|विद्यालय|छात्र|education|school|college|student/i },
  { category: "employment", words: /रोज़गार|नौकरी|employment|job|skill|rozgar/i },
  { category: "schemes", words: /योजना|सब्सिडी|scheme|subsidy|beneficiary|ration/i },
  { category: "municipal", words: /नगरपालिका|नगर निगम|municipal|waste|सफ़ाई|sanitation/i },
  { category: "safety", words: /पुलिस|सुरक्षा|अपराध|police|safety|crime/i },
  { category: "state", words: /राज्य|मुख्यमंत्री|विधानसभा|state|chief minister|assembly/i },
  { category: "national", words: /संसद|प्रधानमंत्री|राष्ट्रपति|parliament|prime minister|president/i },
];

function classify(title: string, summary: string): NewsCategory {
  const haystack = `${title} ${summary}`;
  for (const rule of categoryKeywords) if (rule.words.test(haystack)) return rule.category;
  return "national";
}

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function safeDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseRss(xml: string, sourceId: string): NewsArticle[] {
  const source = newsSources.find((item) => item.id === sourceId);
  if (!source) return [];
  const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].slice(0, 20);
  const articles: NewsArticle[] = [];
  for (const match of items) {
    const block = match[0];
    const title = firstTag(block, "title");
    const link = safeUrl(firstTag(block, "link"));
    if (!title || !link) continue;
    const rawSummary = firstTag(block, "description");
    const summary = rawSummary.length > 420 ? `${rawSummary.slice(0, 417).trim()}…` : rawSummary;
    const publishedAt = safeDate(firstTag(block, "pubDate"));
    const id = `rss-${source.id}-${Buffer.from(link).toString("base64url").slice(0, 32)}`;
    articles.push({
      id,
      title: { hi: title, en: title },
      summary: { hi: summary || "मूल स्रोत पर पूरी खबर पढ़ें।", en: summary || "Read the full story at the original source." },
      category: classify(title, summary),
      stateId: null,
      districtId: null,
      sourceName: source.name,
      sourceUrl: link,
      publishedAt,
      language: source.language,
      isDemo: false,
      lastVerifiedAt: new Date().toISOString(),
    });
  }
  return articles;
}

async function fetchSource(feedUrl: string, sourceId: string): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "KyaBoltiPublic/1.0 (+https://kyaboltipublic.in; civic news aggregator)",
        accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    if (!xml.includes("<rss") && !xml.includes("<feed")) throw new Error("Unsupported feed format");
    return parseRss(xml, sourceId);
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshNews(): Promise<{ articles: NewsArticle[]; errors: string[]; sources: number }> {
  const enabled = newsSources.filter((source) => source.enabled);
  const errors: string[] = [];
  const results: NewsArticle[] = [];
  const settled = await Promise.allSettled(
    enabled.map(async (source) => {
      try {
        return await fetchSource(source.feedUrl, source.id);
      } catch (error) {
        errors.push(`${source.name}: ${(error as Error).message}`);
        return [];
      }
    }),
  );
  for (const result of settled) {
    if (result.status === "fulfilled") results.push(...result.value);
  }
  const seen = new Set<string>();
  const deduped = results.filter((article) => {
    const key = article.sourceUrl ?? article.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  cache = { articles: deduped, fetchedAt: Date.now(), errors };
  return { articles: deduped, errors, sources: enabled.length };
}

export async function getNews(): Promise<{
  articles: NewsArticle[];
  isLive: boolean;
  errors: string[];
  fetchedAt: string | null;
}> {
  // Explicit offline mode for local demos, CI and air-gapped previews. Demo
  // stories remain clearly labelled in the UI.
  if (process.env.KBP_DISABLE_LIVE_NEWS === "1") {
    return {
      articles: demoNews,
      isLive: false,
      errors: ["Live news fetch is disabled by KBP_DISABLE_LIVE_NEWS."],
      fetchedAt: null,
    };
  }
  if (!cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    try {
      const result = await refreshNews();
      if (result.articles.length === 0) {
        return {
          articles: demoNews,
          isLive: false,
          errors: result.errors,
          fetchedAt: cache ? new Date(cache.fetchedAt).toISOString() : null,
        };
      }
    } catch (error) {
      return {
        articles: demoNews,
        isLive: false,
        errors: [String(error)],
        fetchedAt: cache ? new Date(cache.fetchedAt).toISOString() : null,
      };
    }
  }
  const snapshot = cache as CacheEntry | null;
  const hasLive = Boolean(snapshot?.articles.length);
  return {
    articles: hasLive ? snapshot!.articles : demoNews,
    isLive: hasLive,
    errors: snapshot?.errors ?? [],
    fetchedAt: snapshot ? new Date(snapshot.fetchedAt).toISOString() : null,
  };
}

export function __resetNewsCache() {
  cache = null;
}

export function __setNewsCache(articles: NewsArticle[]) {
  cache = { articles, fetchedAt: Date.now(), errors: [] };
}
