"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { NewsCard } from "@/components/news-card";
import { newsCategories } from "@/data/news";
import { categoryLabel } from "@/lib/labels";
import type { NewsArticle } from "@/lib/types";
import { Alert, Badge, buttonClass, cn } from "@/components/ui";
import { IconArrowRight, IconClock, IconPin, IconSearch } from "@/components/icons";

export function NewsExplorer({
  articles,
  isLive,
  fetchedAt,
  initialCategory,
  feedErrors,
}: {
  articles: NewsArticle[];
  isLive: boolean;
  fetchedAt: string | null;
  initialCategory?: string;
  feedErrors: number;
}) {
  const { locale, t } = useLocale();
  const { location, label, openLocation } = useLocation();
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [query, setQuery] = useState("");
  const [localOnly, setLocalOnly] = useState(false);
  const [language, setLanguage] = useState<"all" | "hi" | "en">("all");

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      if (category !== "all" && article.category !== category) return false;
      if (language !== "all" && article.language !== language) return false;
      if (localOnly && article.districtId !== location.districtId && article.stateId !== location.stateId) return false;
      if (query.trim()) {
        const haystack = `${article.title.hi} ${article.title.en} ${article.summary.hi} ${article.summary.en} ${article.sourceName}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [articles, category, language, localOnly, location.districtId, location.stateId, query]);

  const categoryMap = Object.fromEntries(newsCategories.map((item) => [item.id, { hi: item.hi, en: item.en }]));

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={openLocation} className={buttonClass("outline", "sm")}>
          <IconPin className="h-4 w-4 text-brand-600" />
          {label}
        </button>
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-navy-200 bg-white px-3 text-xs font-semibold text-navy-700">
          <input
            type="checkbox"
            checked={localOnly}
            onChange={(event) => setLocalOnly(event.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          {locale === "hi" ? "सिर्फ़ मेरे इलाके" : "Only my area"}
        </label>
        <Badge tone={isLive ? "teal" : "gold"}>
          {isLive ? t.common.live : t.common.demo}
        </Badge>
        <span className="text-[0.7rem] text-navy-500">
          {articles.length} {locale === "hi" ? "खबरें" : "stories"}
        </span>
        {feedErrors > 0 && isLive ? (
          <span className="text-[0.66rem] text-amber-700">
            {locale === "hi" ? `${feedErrors} फ़ीड उपलब्ध नहीं` : `${feedErrors} feed(s) unavailable`}
          </span>
        ) : null}
      </div>

      {!isLive ? (
        <div className="mb-5">
          <Alert tone="warning" title={locale === "hi" ? "डेमो सामग्री" : "Demo content"}>
            {t.news.demoNotice}
          </Alert>
        </div>
      ) : (
        <div className="mb-5">
          <Alert tone="info">{t.news.liveNotice}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">{t.search.placeholder}</span>
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search.placeholder}
            className="min-h-11 w-full rounded-xl border border-navy-200 bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="news-language">
            {t.common.language}
          </label>
          <select
            id="news-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as typeof language)}
            className="min-h-11 rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium"
          >
            <option value="all">{locale === "hi" ? "सभी भाषाएँ" : "All languages"}</option>
            <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
            <option value="en">{locale === "hi" ? "अंग्रेज़ी" : "English"}</option>
          </select>
          <Link href="/sources" className={buttonClass("outline", "md")}>
            {t.footer.sources}
          </Link>
        </div>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => setCategory("all")}
          aria-pressed={category === "all"}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-xs font-bold",
            category === "all" ? "bg-navy-900 text-white" : "border border-navy-200 bg-white text-navy-600",
          )}
        >
          {t.common.all}
        </button>
        {newsCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-xs font-bold",
              category === item.id ? "bg-brand-600 text-white" : "border border-navy-200 bg-white text-navy-600",
            )}
          >
            {categoryLabel(categoryMap, item.id, locale)}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-14 text-center">
          <p className="hindi text-base font-bold text-navy-900">{t.news.empty}</p>
          <p className="mt-1 text-sm text-navy-500">{t.search.hint}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setQuery("");
                setLocalOnly(false);
                setLanguage("all");
              }}
              className={buttonClass("primary", "sm")}
            >
              {t.common.all}
            </button>
            <Link href="/search" className={buttonClass("outline", "sm")}>
              {t.search.title} <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-navy-400">
        {fetchedAt ? (
          <span className="inline-flex items-center gap-1">
            <IconClock className="h-3 w-3" /> {t.common.lastUpdated}: {new Date(fetchedAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}
          </span>
        ) : null}
        <span>{locale === "hi" ? "शीर्षक और सारांश मूल स्रोत से लिंक करते हैं।" : "Headlines and summaries link back to the original source."}</span>
      </div>
    </div>
  );
}
