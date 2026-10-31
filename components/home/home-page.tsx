"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { useAssistant } from "@/components/assistant-context";
import { NewsCard } from "@/components/news-card";
import { PollCard } from "@/components/poll-card";
import { CategoryGlyph } from "@/components/category-glyph";
import { quizzes } from "@/data/quizzes";
import { newsCategories } from "@/data/news";
import { roleInfo } from "@/data/representatives";
import type { CivicIssue, NewsArticle, PollWithResults, SiteStats, Thread } from "@/lib/types";
import { pick } from "@/lib/i18n";
import { categoryLabel, issueStatusLabels, relativeTime } from "@/lib/labels";
import { quizIcons } from "@/components/icons";
import {
  IconArrowRight,
  IconClock,
  IconExternal,
  IconGame,
  IconMic,
  IconNews,
  IconPin,
  IconPoll,
  IconQa,
  IconScheme,
  IconSpark,
  IconUsers,
} from "@/components/icons";
import { Alert, Badge, ButtonLink, DemoBadge, SectionHeading, buttonClass, cn } from "@/components/ui";

type HomeProps = {
  news: NewsArticle[];
  newsLive: boolean;
  newsFetchedAt: string | null;
  issues: CivicIssue[];
  threads: Thread[];
  stats: SiteStats;
};

const categoryTabs = ["all", "local", "roads", "water", "schemes"] as const;

export function HomePage({ news, newsLive, newsFetchedAt, issues, threads, stats }: HomeProps) {
  const { locale, t } = useLocale();
  const { location, label, openLocation, hydrated } = useLocation();
  const { openAssistant } = useAssistant();
  const [category, setCategory] = useState<(typeof categoryTabs)[number]>("all");
  const [polls, setPolls] = useState<PollWithResults[] | null>(null);
  const [pollsError, setPollsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/polls")
      .then((response) => response.json())
      .then((data: { ok: boolean; polls?: PollWithResults[] }) => {
        if (!active) return;
        if (data.ok && data.polls) setPolls(data.polls);
        else setPollsError(true);
      })
      .catch(() => {
        if (active) setPollsError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const localNews = useMemo(() => {
    const filtered = news.filter((article) => {
      if (category !== "all" && article.category !== category) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      const score = (article: NewsArticle) =>
        article.districtId === location.districtId
          ? 3
          : article.stateId === location.stateId
            ? 2
            : article.stateId === null
              ? 1
              : 0;
      return score(b) - score(a);
    });
    return sorted.slice(0, 4);
  }, [news, category, location.districtId, location.stateId]);

  const localNewsCount = news.filter(
    (article) => article.districtId === location.districtId || article.stateId === location.stateId,
  ).length;

  const localIssues = useMemo(() => {
    const local = issues.filter((issue) => issue.districtId === location.districtId);
    return (local.length ? local : issues).slice(0, 3);
  }, [issues, location.districtId]);

  const localThreads = useMemo(() => {
    const local = threads.filter((thread) => thread.districtId === location.districtId);
    return (local.length ? local : threads).slice(0, 3);
  }, [threads, location.districtId]);

  const featuredPolls = polls?.slice(0, 1) ?? [];
  const representativeRoles = ["mp", "mla", "councillor", "gram_pradhan"] as const;
  const categoryMap = Object.fromEntries(newsCategories.map((item) => [item.id, { hi: item.hi, en: item.en }]));

  return (
    <div className="pb-6">
      {/* HERO */}
      <section className="container-page pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-navy-950 text-white shadow-float sm:rounded-[2rem]">
          <div
            className="pointer-events-none absolute -right-24 -top-40 h-[34rem] w-[34rem] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(242,106,33,0.38), rgba(242,106,33,0.04) 55%, transparent 70%)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
              maskImage: "linear-gradient(to bottom, black, transparent 78%)",
            }}
            aria-hidden
          />
          <div className="relative grid gap-8 px-5 pb-7 pt-8 sm:px-8 sm:pb-9 sm:pt-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-12 lg:px-12 lg:pb-12 lg:pt-14">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.7rem] font-semibold tracking-wide text-navy-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                {t.home.kicker}
              </p>
              <h1 className="hindi mt-5 text-balance text-[2.35rem] font-extrabold leading-[1.14] tracking-tight sm:text-[3rem] lg:text-[3.45rem]">
                {t.home.title}
                <span className="block text-brand-400">{t.home.titleHighlight}</span>
              </h1>
              <p className="mt-4 max-w-xl text-[0.92rem] leading-relaxed text-navy-200 sm:text-base">{t.home.subtitle}</p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" onClick={openLocation} className={buttonClass("primary", "lg")}>
                  <IconPin className="h-4.5 w-4.5" />
                  {t.home.ctaPrimary}
                </button>
                <button
                  type="button"
                  onClick={() => openAssistant()}
                  className={buttonClass("white", "lg")}
                >
                  <IconSpark className="h-4.5 w-4.5 text-brand-600" />
                  {t.home.ctaSecondary}
                </button>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-navy-300">
                <span>{t.home.trustNote}</span>
                <span className="hidden h-1 w-1 rounded-full bg-navy-500 sm:block" />
                <span>{locale === "hi" ? "डेमो सामग्री स्पष्ट रूप से चिह्नित" : "Demo content clearly labelled"}</span>
              </p>
            </div>

            <div className="animate-fade-up-delay rounded-2xl border border-white/12 bg-white/[0.055] p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                    <IconPin className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-navy-300">{t.location.label}</p>
                    <p className="hindi truncate text-sm font-bold text-white">{hydrated ? label : "लखनऊ, उत्तर प्रदेश"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openLocation}
                  className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-navy-100 hover:bg-white/10"
                >
                  {t.common.change}
                </button>
              </div>

              <div className="mt-2 space-y-1.5">
                {[
                  { href: "/news", icon: IconNews, hi: "आज की स्थानीय खबरें", en: "Today's local news", meta: `${localNewsCount} ${locale === "hi" ? "खबरें" : "stories"}` },
                  { href: "/representatives", icon: IconUsers, hi: "मेरे जनप्रतिनिधि", en: "My representatives", meta: locale === "hi" ? "आधिकारिक स्रोत" : "Official sources" },
                  { href: "/issues/new", icon: IconScheme, hi: "समस्या दर्ज करें", en: "Report an issue", meta: locale === "hi" ? "ट्रैकिंग कोड" : "Tracking code" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.07]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-navy-100">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="hindi block truncate text-[0.82rem] font-semibold text-white">
                          {locale === "hi" ? item.hi : item.en}
                        </span>
                        <span className="block text-[0.62rem] text-navy-400">{item.meta}</span>
                      </span>
                      <IconArrowRight className="h-4 w-4 shrink-0 text-navy-500 transition group-hover:translate-x-0.5 group-hover:text-brand-400" />
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => openAssistant(locale === "hi" ? "आज की स्थानीय खबरें बताओ" : "Tell me today's local news")}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-gold-400/10 px-3 py-2.5 text-left hover:bg-gold-400/15"
              >
                <IconMic className="h-4 w-4 shrink-0 text-gold-400" />
                <span className="text-[0.72rem] font-medium text-gold-100">
                  {locale === "hi" ? "बोलकर पूछें: “आज की खबरें बताओ”" : "Ask by voice: “Tell me today's news”"}
                </span>
              </button>
            </div>
          </div>

          <div className="relative grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
            {[
              { value: "113", hi: "ज़िले शुरुआत में", en: "districts at launch" },
              { value: String(quizzes.length), hi: "नागरिक क्विज़", en: "civic quizzes" },
              { value: "5", hi: "भागीदारी उपकरण", en: "participation tools" },
              { value: "100%", hi: "मुफ़्त और स्वतंत्र", en: "free & independent" },
            ].map((stat) => (
              <div key={stat.en} className="border-r border-white/10 px-4 py-4 last:border-r-0 sm:px-6">
                <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{stat.value}</p>
                <p className="hindi mt-0.5 text-[0.66rem] font-medium text-navy-300">{locale === "hi" ? stat.hi : stat.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS + SIDEBAR */}
      <section className="container-page mt-10 sm:mt-14" aria-labelledby="local-news-heading">
        <SectionHeading
          kicker={locale === "hi" ? "आपके इलाके से" : "From your area"}
          title={t.home.latestNews}
          description={t.home.latestNewsSub}
          action={
            <ButtonLink href="/news" variant="outline" size="sm">
              {t.common.viewAll} <IconArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          }
        />
        <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div>
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label={t.news.category}>
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={category === tab}
                  onClick={() => setCategory(tab)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[0.72rem] font-bold transition",
                    category === tab
                      ? "bg-navy-900 text-white"
                      : "border border-navy-200 bg-white text-navy-600 hover:border-navy-300",
                  )}
                >
                  {tab === "all" ? t.common.all : categoryLabel(categoryMap, tab, locale)}
                </button>
              ))}
            </div>

            {!newsLive ? (
              <div className="mb-3">
                <Alert tone="warning" title={t.news.demoNotice.split("।")[0] + "।"}>
                  <span className="text-[0.78rem]">
                    {locale === "hi"
                      ? "लाइव फ़ीड उपलब्ध होने पर स्रोत लिंक दिखेंगे। अभी सभी कार्ड डेमो हैं।"
                      : "Source links will appear when a live feed is available. All cards below are demo content."}
                  </span>
                </Alert>
              </div>
            ) : null}

            {localNews.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {localNews.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-navy-200 bg-white p-8 text-center">
                <p className="hindi text-sm font-bold text-navy-800">{t.news.empty}</p>
                <button type="button" onClick={() => setCategory("all")} className={buttonClass("outline", "sm", "mt-3")}>
                  {t.common.all}
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-navy-400">
              <span>
                {newsLive ? t.news.liveNotice : t.news.liveUnavailable}
              </span>
              {newsFetchedAt ? (
                <span className="inline-flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  {t.common.lastUpdated}: {relativeTime(newsFetchedAt, locale)}
                </span>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="hindi text-sm font-extrabold text-navy-900">{t.home.polls}</h3>
                <Link href="/polls" className="text-[0.7rem] font-bold text-brand-700 hover:underline">
                  {t.common.viewAll}
                </Link>
              </div>
              {pollsError ? (
                <Alert tone="warning">{t.common.error}</Alert>
              ) : polls === null ? (
                <div className="surface p-4" aria-busy="true">
                  <div className="h-3 w-24 animate-pulse rounded bg-navy-100" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-navy-100" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-navy-100" />
                  <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-navy-100" />
                </div>
              ) : featuredPolls.length ? (
                <PollCard initial={featuredPolls[0]} compact />
              ) : (
                <div className="surface p-5 text-sm text-navy-600">{locale === "hi" ? "अभी कोई पोल नहीं है।" : "No polls yet."}</div>
              )}
            </div>

            <div className="surface p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
                  <IconUsers className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="hindi text-sm font-extrabold text-navy-900">{t.home.reps}</h3>
                  <p className="text-[0.66rem] text-navy-500">{locale === "hi" ? "सत्यापित स्रोत से जाँचें" : "Verify with official sources"}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {representativeRoles.map((role) => (
                  <div key={role} className="flex items-center justify-between gap-2 rounded-lg bg-navy-50 px-2.5 py-1.5">
                    <span className="hindi text-[0.75rem] font-semibold text-navy-700">{pick(roleInfo[role].title, locale)}</span>
                    <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wide text-amber-700">
                      {t.common.unverified}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.68rem] leading-relaxed text-navy-500">{t.reps.notVerifiedBody.split("।")[0]}।</p>
              <Link href="/representatives" className={buttonClass("outline", "sm", "mt-3 w-full")}>
                {t.reps.title} <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* CIVIC TOOLS */}
      <section className="container-page mt-12 sm:mt-16" aria-labelledby="civic-tools">
        <SectionHeading
          kicker={locale === "hi" ? "भागीदारी" : "Participate"}
          title={locale === "hi" ? "आपके हाथ में तीन शक्तिशाली उपकरण" : "Three powerful civic tools"}
          description={locale === "hi" ? "समस्या बताइए, राय दीजिए और अपने अधिकार समझिए — सब कुछ सरल भाषा में।" : "Report a problem, share your view, and understand your rights — all in plain language."}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/issues/new",
              tone: "bg-navy-950 text-white",
              icon: IconScheme,
              kicker: locale === "hi" ? "समस्या" : "Issue",
              title: locale === "hi" ? "इलाके की समस्या दर्ज करें" : "Report a local issue",
              body: locale === "hi" ? "सड़क, पानी, सफ़ाई या स्ट्रीटलाइट। ट्रैकिंग कोड पाएँ और सही विभाग खोजें।" : "Roads, water, sanitation or streetlights. Get a tracking code and find the right department.",
              count: `${stats.issues} ${locale === "hi" ? "रिकॉर्ड" : "records"}`,
              button: t.issues.report,
            },
            {
              href: "/polls",
              tone: "bg-brand-600 text-white",
              icon: IconPoll,
              kicker: locale === "hi" ? "राय" : "Opinion",
              title: locale === "hi" ? "जनता क्या कह रही है?" : "What are people saying?",
              body: locale === "hi" ? "गैर-आधिकारिक सामुदायिक पोल में हिस्सा लें। नतीजे जनमत का वैज्ञानिक नमूना नहीं हैं।" : "Join unofficial community polls. Results are not a scientific sample of public opinion.",
              count: `${stats.polls} ${locale === "hi" ? "सक्रिय पोल" : "active polls"}`,
              button: t.polls.vote,
            },
            {
              href: "/games",
              tone: "bg-teal-700 text-white",
              icon: IconGame,
              kicker: locale === "hi" ? "सीखें" : "Learn",
              title: locale === "hi" ? "संविधान और योजनाएँ समझें" : "Understand the Constitution & schemes",
              body:
                locale === "hi"
                  ? `${quizzes.length} छोटे खेलों में अपने अधिकार, भूमिकाएँ और सरकारी योजनाएँ सीखें।`
                  : `Learn rights, roles and schemes in ${quizzes.length} short games.`,
              count: `${quizzes.length} ${locale === "hi" ? "खेल" : "games"}`,
              button: t.games.start,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={cn("group relative flex flex-col overflow-hidden rounded-2xl p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-float sm:p-6", card.tone)}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12">
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <span className="rounded-full bg-white/12 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide">{card.kicker}</span>
                </div>
                <h3 className="hindi mt-4 text-xl font-extrabold leading-snug">{card.title}</h3>
                <p className="mt-1.5 text-[0.8rem] leading-relaxed opacity-80">{card.body}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
                  <span className="text-[0.68rem] font-semibold opacity-75">{card.count}</span>
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-bold">
                    {card.button} <IconArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ISSUES + TRENDING */}
      <section className="container-page mt-12 grid gap-8 sm:mt-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading
            kicker={locale === "hi" ? "नागरिक रिकॉर्ड" : "Civic record"}
            title={t.home.issues}
            description={t.home.issuesSub}
            action={
              <ButtonLink href="/issues" variant="outline" size="sm">
                {t.common.viewAll}
              </ButtonLink>
            }
          />
          <div className="space-y-2.5">
            {localIssues.map((issue) => {
              const status = issueStatusLabels[issue.status];
              return (
                <Link
                  key={issue.id}
                  href={`/issues?code=${encodeURIComponent(issue.trackingCode)}`}
                  className="group flex items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-card transition hover:border-navy-200"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <CategoryGlyph category={issue.category} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[0.6rem] font-bold",
                        status.tone === "gold" && "bg-amber-100 text-amber-900",
                        status.tone === "teal" && "bg-teal-100 text-teal-800",
                        status.tone === "navy" && "bg-navy-900 text-white",
                        status.tone === "success" && "bg-green-100 text-green-800",
                        status.tone === "neutral" && "bg-navy-100 text-navy-700",
                      )}>
                        {status[locale]}
                      </span>
                      {issue.isDemo ? <DemoBadge label={t.common.demo} /> : null}
                      <span className="text-[0.62rem] font-medium text-navy-400">{issue.area}</span>
                    </span>
                    <span className="hindi mt-1 block text-[0.88rem] font-bold leading-snug text-navy-900 group-hover:text-brand-800">
                      {issue.title}
                    </span>
                    <span className="mt-0.5 block text-[0.65rem] text-navy-400">
                      {issue.trackingCode} · {relativeTime(issue.createdAt, locale)}
                    </span>
                  </span>
                  <IconArrowRight className="mt-1 h-4 w-4 shrink-0 text-navy-300 transition group-hover:text-brand-600" />
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/issues/new" className={buttonClass("primary", "sm")}>
              + {t.issues.report}
            </Link>
            <Link href="/issues#track" className={buttonClass("ghost", "sm")}>
              {t.issues.track}
            </Link>
          </div>
        </div>

        <div>
          <SectionHeading
            kicker={locale === "hi" ? "आस-पास" : "Nearby"}
            title={t.home.trending}
            description={t.home.trendingSub}
            action={
              <ButtonLink href="/discussions" variant="ghost" size="sm">
                {t.nav.community}
              </ButtonLink>
            }
          />
          <div className="space-y-2">
            {localThreads.map((thread, index) => (
              <Link
                key={thread.id}
                href={`/discussions/${thread.id}`}
                className="group flex gap-3 rounded-xl border border-navy-100 bg-white p-3.5 transition hover:border-brand-200 hover:bg-brand-50/30"
              >
                <span className="mt-0.5 text-sm font-extrabold tabular-nums text-brand-300">0{index + 1}</span>
                <span className="min-w-0">
                  <span className="hindi block text-[0.84rem] font-bold leading-snug text-navy-900 group-hover:text-brand-800">
                    {thread.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[0.64rem] text-navy-500">
                    <Badge tone="outline">{thread.replyCount} {t.discussions.replies}</Badge>
                    <span>{thread.districtId.split("-").slice(1).join(" ")}</span>
                    {thread.isDemo ? <span className="text-amber-700">{t.common.demo}</span> : null}
                  </span>
                </span>
              </Link>
            ))}
            <Link
              href="/reviews"
              className="group flex items-center justify-between gap-3 rounded-xl border border-dashed border-navy-200 bg-cream p-3.5"
            >
              <span>
                <span className="hindi block text-[0.82rem] font-bold text-navy-900">{t.home.reviews}</span>
                <span className="text-[0.66rem] text-navy-500">{t.home.reviewsSub}</span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-navy-500 shadow-sm group-hover:text-brand-700">
                <IconArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* GAMES */}
      <section className="container-page mt-12 sm:mt-16">
        <SectionHeading
          kicker={locale === "hi" ? "मुफ़्त · हिंदी-पहले" : "Free · Hindi-first"}
          title={t.home.games}
          description={t.home.gamesSub}
          action={
            <ButtonLink href="/games" variant="outline" size="sm">
              {t.common.viewAll}
            </ButtonLink>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quizzes.slice(0, 4).map((quiz) => {
            const Icon = quizIcons[quiz.icon as keyof typeof quizIcons] ?? IconGame;
            return (
              <Link
                key={quiz.slug}
                href={`/games/${quiz.slug}`}
                className="group flex flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="hindi mt-3 text-[0.92rem] font-extrabold leading-snug text-navy-900">{pick(quiz.title, locale)}</span>
                <span className="mt-1 line-clamp-2 text-[0.72rem] leading-relaxed text-navy-500">{pick(quiz.description, locale)}</span>
                <span className="mt-auto flex items-center justify-between pt-3 text-[0.66rem] font-bold">
                  <span className="text-navy-400">{quiz.questions.length} {t.games.question}</span>
                  <span className="inline-flex items-center gap-1 text-brand-700">
                    {t.games.start} <IconArrowRight className="h-3 w-3" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ASSISTANT BAND */}
      <section className="container-page mt-12 sm:mt-16">
        <div className="overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-card">
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="p-6 sm:p-9">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-700">
                {locale === "hi" ? "आवाज़ से जानकारी" : "Information by voice"}
              </p>
              <h2 className="hindi mt-2 text-balance text-2xl font-extrabold text-navy-900 sm:text-3xl">
                {t.home.assistant}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-navy-600">{t.assistant.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  locale === "hi" ? "आज की खबरें बताओ" : "Today's news",
                  locale === "hi" ? "मेरे MLA कौन हैं?" : "Who is my MLA?",
                  locale === "hi" ? "पानी की शिकायत कहाँ करें?" : "Water complaint",
                  locale === "hi" ? "एक quiz खिलाओ" : "Start a quiz",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => openAssistant(prompt)}
                    className="rounded-full border border-navy-200 bg-cream px-3 py-1.5 text-[0.72rem] font-semibold text-navy-700 hover:border-brand-300 hover:bg-brand-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => openAssistant()} className={buttonClass("primary", "md")}>
                  <IconMic className="h-4 w-4" /> {locale === "hi" ? "बोलकर पूछें" : "Ask by voice"}
                </button>
                <Link href="/assistant" className={buttonClass("outline", "md")}>
                  {locale === "hi" ? "लिखकर पूछें" : "Ask by text"}
                </Link>
              </div>
              <p className="mt-3 text-[0.66rem] text-navy-400">{t.assistant.noAutoplay}</p>
            </div>
            <div className="relative min-h-[15rem] overflow-hidden bg-navy-950 p-6 text-white sm:p-8">
              <div
                className="absolute -right-16 -top-16 h-56 w-56 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(242,106,33,0.45), transparent 65%)" }}
                aria-hidden
              />
              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
                    <IconSpark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="hindi text-sm font-bold">{t.assistant.title}</p>
                    <p className="text-[0.64rem] text-navy-300">{locale === "hi" ? "सीमित इरादे, स्पष्ट जवाब" : "Limited intents, clear answers"}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl rounded-tl-sm bg-white/10 p-3 text-[0.8rem] leading-relaxed text-navy-100">
                  <span className="hindi">
                    {locale === "hi"
                      ? "नमस्कार! बताइए, आप अपने इलाके के बारे में क्या जानना चाहते हैं?"
                      : "Namaskar! What would you like to know about your area?"}
                  </span>
                </div>
                <div className="mt-2 ml-auto w-fit rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-[0.75rem] font-semibold">
                  {locale === "hi" ? "पानी की शिकायत कहाँ करें?" : "Where do I report water issues?"}
                </div>
                <div className="mt-2 rounded-2xl rounded-tl-sm bg-white/10 p-3 text-[0.72rem] leading-relaxed text-navy-100">
                  {locale === "hi"
                    ? "स्थानीय नगरीय निकाय या ग्राम पंचायत से संपर्क करें। आधिकारिक पोर्टल का लिंक भी मिलेगा।"
                    : "Contact your local urban body or gram panchayat. I will also share the official portal link."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page mt-12 sm:mt-16">
        <SectionHeading
          kicker={locale === "hi" ? "खोज" : "Explore"}
          title={t.home.categories}
          description={locale === "hi" ? "अपने इलाके की जानकारी श्रेणी के हिसाब से पढ़ें।" : "Browse local information by category."}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {newsCategories.map((item) => (
            <Link
              key={item.id}
              href={`/news?category=${item.id}`}
              className="group flex min-h-20 flex-col justify-between rounded-xl border border-navy-100 bg-white p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
            >
              <CategoryGlyph category={item.id} className="h-5 w-5 text-brand-600" />
              <span className="hindi mt-2 text-[0.76rem] font-bold leading-tight text-navy-800">
                {locale === "hi" ? item.hi : item.en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SOURCE NOTE */}
      <section className="container-page mt-12 sm:mt-16">
        <div className="grid gap-4 rounded-2xl border border-navy-100 bg-white p-5 md:grid-cols-[auto_1fr_auto] md:items-center md:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <IconQa className="h-5.5 w-5.5" />
          </span>
          <div>
            <p className="hindi text-sm font-extrabold text-navy-900">
              {locale === "hi" ? "हम तथ्य और राय को अलग रखते हैं" : "We keep facts and opinions separate"}
            </p>
            <p className="mt-0.5 text-[0.76rem] leading-relaxed text-navy-600">
              {locale === "hi"
                ? "खबरों में स्रोत और समय; पोल में स्पष्ट ‘अनौपचारिक’ लेबल; समीक्षाओं में ‘व्यक्तिगत अनुभव’। डेमो सामग्री हमेशा चिह्नित रहती है।"
                : "Sources and timestamps on news; clear “unofficial” labels on polls; personal experience on reviews. Demo content is always labelled."}
            </p>
          </div>
          <Link href="/sources" className={buttonClass("outline", "sm")}>
            {t.footer.sources} <IconExternal className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
