"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { Badge, EmptyState, buttonClass, cn } from "@/components/ui";
import { IconExternal, IconSearch, IconSpark } from "@/components/icons";
import { searchSuggestions, type SearchResult, type SearchResultType } from "@/lib/search-shared";

type SearchResponse = {
  ok?: boolean;
  query?: string;
  groups?: Record<SearchResultType, SearchResult[]>;
  total?: number;
  error?: string;
};

const groupLabels: Record<SearchResultType, { hi: string; en: string }> = {
  news: { hi: "खबरें", en: "News" },
  page: { hi: "पेज", en: "Pages" },
  representative: { hi: "जनप्रतिनिधि", en: "Representatives" },
  poll: { hi: "पोल", en: "Polls" },
  quiz: { hi: "क्विज़", en: "Quizzes" },
  issue: { hi: "समस्याएँ", en: "Issues" },
  question: { hi: "सवाल-जवाब", en: "Q&A" },
};

const order: SearchResultType[] = ["page", "news", "representative", "poll", "quiz", "issue", "question"];

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const { locale } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery.trim());
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (submitted.trim().length < 2) {
      setData(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    fetch(`/api/search?q=${encodeURIComponent(submitted)}&locale=${locale}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result: SearchResponse) => {
        if (!active) return;
        if (result.ok) setData(result);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [submitted, locale]);

  const groups = data?.groups;
  const total = data?.total ?? 0;

  return (
    <div className="container-page py-8 sm:py-10">
      <form
        className="mx-auto flex max-w-2xl gap-2"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query);
          const url = new URL(window.location.href);
          if (query.trim()) url.searchParams.set("q", query.trim());
          else url.searchParams.delete("q");
          window.history.replaceState(null, "", url.toString());
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          {locale === "hi" ? "खोजें" : "Search"}
        </label>
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-navy-400" />
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "hi" ? "खबर, जनप्रतिनिधि, पोल, योजना या मुद्दा खोजें…" : "Search news, representatives, polls, schemes or issues…"}
            className="w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <button type="submit" className={buttonClass("primary", "md")}>
          {locale === "hi" ? "खोजें" : "Search"}
        </button>
      </form>

      {submitted.trim().length < 2 ? (
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
              <IconSpark className="h-4 w-4 text-brand-600" /> {locale === "hi" ? "सुझाए गए विषय" : "Suggested topics"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {searchSuggestions.map((suggestion) => (
                <Link
                  key={suggestion.href}
                  href={suggestion.href}
                  className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-navy-700 hover:border-brand-300 hover:bg-brand-50"
                >
                  {locale === "hi" ? suggestion.hi : suggestion.en}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[0.72rem] text-navy-500">
              {locale === "hi"
                ? "सुझाव: ‘पानी’, ‘संविधान’, ‘पार्षद’ या ‘योजना’ लिखें।"
                : "Try ‘water’, ‘constitution’, ‘councillor’ or ‘scheme’."}
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-center text-sm text-navy-500" role="status">
          {locale === "hi" ? "खोज रहे हैं…" : "Searching…"}
        </p>
      ) : null}

      {error ? (
        <p className="mt-8 text-center text-sm text-red-700" role="alert">
          {locale === "hi" ? "खोज में दिक्कत आई। फिर कोशिश करें।" : "Search failed. Please try again."}
        </p>
      ) : null}

      {!loading && !error && data && total === 0 ? (
        <div className="mx-auto mt-8 max-w-2xl">
          <EmptyState
            icon={<IconSearch className="h-7 w-7" />}
            title={locale === "hi" ? "कुछ नहीं मिला" : "No results found"}
            description={locale === "hi" ? "दूसरे शब्द आज़माएँ या श्रेणी बदलें।" : "Try different words or another topic."}
          />
        </div>
      ) : null}

      {!loading && data && total > 0 ? (
        <div className="mx-auto mt-6 max-w-3xl">
          <p className="mb-4 text-[0.75rem] font-semibold text-navy-500">
            “{data.query}” — {total} {locale === "hi" ? "परिणाम" : "results"}
          </p>
          <div className="space-y-6">
            {order.map((type) => {
              const items = groups?.[type] ?? [];
              if (items.length === 0) return null;
              return (
                <section key={type} aria-labelledby={`group-${type}`}>
                  <h2 id={`group-${type}`} className="mb-2 flex items-center gap-2 text-sm font-extrabold text-navy-900">
                    {locale === "hi" ? groupLabels[type].hi : groupLabels[type].en}
                    <Badge tone="neutral">{items.length}</Badge>
                  </h2>
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const content = (
                        <div className="rounded-xl border border-navy-100 bg-white px-4 py-3 transition hover:border-brand-200">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="hindi text-[0.88rem] font-bold text-navy-900">{item.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-relaxed text-navy-600">{item.description}</p>
                              {item.meta ? (
                                <span className="mt-1 inline-block text-[0.64rem] font-semibold uppercase tracking-wide text-navy-400">
                                  {item.meta === "Demo" ? (locale === "hi" ? "डेमो" : "Demo") : item.meta}
                                </span>
                              ) : null}
                            </div>
                            {item.external ? <IconExternal className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" /> : null}
                          </div>
                        </div>
                      );
                      return (
                        <li key={`${type}-${item.id}`}>
                          {item.external ? (
                            <a href={item.href} target="_blank" rel="noreferrer noopener" className="block">
                              {content}
                            </a>
                          ) : (
                            <Link href={item.href} className="block">
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className={cn("mt-8 text-center text-[0.68rem] text-navy-400", submitted.trim().length < 2 && "hidden")}>
        {locale === "hi"
          ? "खोज केवल इस मंच की सामग्री में करती है। तथ्य हमेशा आधिकारिक स्रोत से जाँचें।"
          : "Search covers this platform's content only. Always verify facts with official sources."}
      </p>
    </div>
  );
}
