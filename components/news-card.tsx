"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-context";
import { categoryLabel, relativeTime } from "@/lib/labels";
import { newsCategories } from "@/data/news";
import type { NewsArticle } from "@/lib/types";
import { CategoryGlyph } from "@/components/category-glyph";
import { IconArrowRight, IconClock, IconExternal } from "@/components/icons";
import { DemoBadge } from "@/components/ui";

export function NewsCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const { locale, t } = useLocale();
  const title = locale === "hi" ? article.title.hi : article.title.en;
  const summary = locale === "hi" ? article.summary.hi : article.summary.en;
  const sourceName = article.isDemo && locale === "en" ? "Sample content (demo)" : article.sourceName;
  const category = categoryLabel(
    Object.fromEntries(newsCategories.map((item) => [item.id, { hi: item.hi, en: item.en }])),
    article.category,
    locale,
  );

  const href = article.sourceUrl ?? "/news";
  const external = Boolean(article.sourceUrl);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-float">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <CategoryGlyph category={article.category} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-brand-700">{category}</span>
            {article.isDemo ? <DemoBadge label={t.common.demo} /> : null}
          </div>
          {external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hindi block text-[0.98rem] font-bold leading-snug text-navy-900 transition group-hover:text-brand-800"
            >
              {title}
            </a>
          ) : (
            <Link href={href} className="hindi block text-[0.98rem] font-bold leading-snug text-navy-900 transition group-hover:text-brand-800">
              {title}
            </Link>
          )}
          {!compact && summary ? (
            <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed text-navy-600">{summary}</p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] text-navy-500">
            <span className="inline-flex items-center gap-1">
              <IconClock className="h-3 w-3" />
              {article.isDemo ? (locale === "hi" ? "उदाहरण समय" : "Sample time") : relativeTime(article.publishedAt, locale)}
            </span>
            <span className="truncate font-medium text-navy-600">{sourceName}</span>
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-semibold text-brand-700 hover:underline"
                aria-label={`${t.news.source}: ${sourceName}`}
              >
                {t.news.source} <IconExternal className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {!external ? (
        <div className="mt-auto flex items-center gap-1 border-t border-navy-50 px-4 py-2.5 text-[0.7rem] font-semibold text-navy-400 sm:px-5">
          {t.common.demo} — {locale === "hi" ? "सत्यापित खबर नहीं" : "not verified news"}
        </div>
      ) : null}
    </article>
  );
}

export function NewsList({ articles, compact }: { articles: NewsArticle[]; compact?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} compact={compact} />
      ))}
    </div>
  );
}

export function NewsEmpty() {
  const { locale, t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-10 text-center">
      <p className="hindi text-sm font-bold text-navy-900">{t.news.empty}</p>
      <Link href="/news" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
        {t.common.viewAll} <IconArrowRight className="h-3.5 w-3.5" />
      </Link>
      <p className="mt-1 text-[0.7rem] text-navy-400">{locale === "hi" ? "अभी डेमो खबरें दिख रही हैं" : "Demo stories are currently shown"}</p>
    </div>
  );
}
