import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicNewsArticle } from "@/lib/news-service";
import { getRepository } from "@/lib/store";
import { getServerLocale } from "@/lib/server-locale";
import { Badge, PageHeader, buttonClass } from "@/components/ui";
import { categoryLabel, formatDate } from "@/lib/labels";
import { newsCategories } from "@/data/news";
import { IconArrowRight, IconExternal } from "@/components/icons";

export const dynamic = "force-dynamic";

const categoryMap = Object.fromEntries(
  newsCategories.map((item) => [item.id, { hi: item.hi, en: item.en }]),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicNewsArticle(slug);
  if (!article) {
    return { title: "खबर नहीं मिली", robots: { index: false, follow: false } };
  }
  const title = article.seoTitle || article.title.hi;
  const description = article.seoDescription || article.shortDescription;
  return {
    title,
    description,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      images: article.imageUrl ? [{ url: article.imageUrl, alt: article.imageAlt ?? title }] : undefined,
    },
    twitter: {
      card: article.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicNewsArticle(slug);
  if (!article) notFound();
  const locale = await getServerLocale();
  const managedCategoryMap = await getRepository()
    .then((repo) => repo.listNewsCategories())
    .then((rows) =>
      Object.fromEntries(rows.map((item) => [item.id, { hi: item.nameHi, en: item.nameEn }])),
    )
    .catch(() => ({} as Record<string, { hi: string; en: string }>));
  const category = categoryLabel({ ...categoryMap, ...managedCategoryMap }, article.category, locale);
  const title = locale === "hi" ? article.title.hi : article.title.en;
  const summary = locale === "hi" ? article.summary.hi : article.summary.en;
  const original = article.originalUrl || article.sourceUrl;
  const paragraphs = article.content
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow={`${category}${article.breaking ? (locale === "hi" ? " · ब्रेकिंग" : " · Breaking") : ""}`}
        title={title}
        description={summary}
      />
      <article className="container-page grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[0.72rem] text-navy-500">
            <Badge tone="brand">{category}</Badge>
            {article.breaking ? <Badge tone="danger">{locale === "hi" ? "ब्रेकिंग" : "Breaking"}</Badge> : null}
            {article.featured ? <Badge tone="gold">{locale === "hi" ? "विशेष" : "Featured"}</Badge> : null}
            <span>{article.sourceName}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(article.publishedAt ?? article.createdAt, locale)}</span>
            <span aria-hidden>·</span>
            <span>{article.language === "hi" ? "हिंदी" : "English"}</span>
          </div>

          {article.imageUrl ? (
            // Remote editorial images are rendered as a normal img; Next Image
            // would need every publisher host allow-listed in next.config.ts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt={article.imageAlt || title}
              className="mt-4 max-h-[26rem] w-full rounded-2xl border border-navy-100 object-cover"
              loading="eager"
            />
          ) : null}

          {paragraphs.length > 0 ? (
            <div className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-navy-800">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-navy-100 bg-white p-5 text-sm leading-relaxed text-navy-700">
              <p className="hindi font-bold text-navy-900">{summary}</p>
              <p className="mt-2 text-[0.8rem] text-navy-500">
                {locale === "hi"
                  ? "यह खबर मूल प्रकाशक से लिंक करती है। पूरी खबर उनके पेज पर पढ़ें।"
                  : "This story links to the original publisher. Read the full article on their page."}
              </p>
            </div>
          )}

          {article.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag} tone="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {original ? (
            <div className="mt-6">
              <a
                href={original}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "md")}
              >
                {locale === "hi" ? "मूल स्रोत पर पढ़ें" : "Read at the original source"}
                <IconExternal className="h-4 w-4" />
              </a>
            </div>
          ) : null}

          <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 p-4 text-[0.72rem] leading-relaxed text-navy-600">
            <p className="font-bold text-navy-800">{locale === "hi" ? "स्रोत और श्रेय" : "Source and attribution"}</p>
            <p className="mt-1">{article.sourceName}</p>
            {original ? (
              <a href={original} className="mt-1 inline-block break-all text-brand-700 underline-offset-2 hover:underline">
                {original}
              </a>
            ) : null}
            <p className="mt-2">
              {locale === "hi"
                ? "हम पूरी खबर कॉपी नहीं करते। शीर्षक, छोटा सारांश और मूल लिंक दिया जाता है।"
                : "We do not copy full articles. We publish a headline, a short summary and a link to the original."}
            </p>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <p className="text-xs font-extrabold text-navy-900">
              {locale === "hi" ? "अन्य खबरें" : "More news"}
            </p>
            <Link href="/news" className={buttonClass("outline", "sm", "mt-2 w-full")}>
              {locale === "hi" ? "सभी खबरें" : "All news"}
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </article>
    </>
  );
}
