import type { NextRequest } from "next/server";
import { getNews } from "@/lib/news";
import { noStore } from "@/lib/api";
import { newsCategories } from "@/data/news";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;
  const districtId = url.searchParams.get("districtId");
  const stateId = url.searchParams.get("stateId");
  const category = url.searchParams.get("category");

  const news = await getNews();
  let articles = news.articles;

  if (category && newsCategories.some((item) => item.id === category)) {
    articles = articles.filter((article) => article.category === category);
  }
  if (stateId) articles = articles.filter((article) => article.stateId === stateId || article.stateId === null);
  if (districtId) {
    const local = articles.filter((article) => article.districtId === districtId);
    if (local.length > 0) articles = local;
  }

  const filtered = articles.slice(0, limit);
  return noStore({
    ok: true,
    articles: filtered,
    total: articles.length,
    isLive: news.isLive,
    fetchedAt: news.fetchedAt,
    feedErrors: news.errors.length,
  });
}
