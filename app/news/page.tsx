import type { Metadata } from "next";
import { getNews } from "@/lib/news";
import { NewsExplorer } from "@/components/news-explorer";
import { PageHeader } from "@/components/ui";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "खबरें और नागरिक जानकारी",
  description: "स्थानीय, राज्य और राष्ट्रीय खबरें — स्रोत, समय और क्षेत्र के साथ।",
  alternates: { canonical: "/news" },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const news = await getNews();
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("स्थानीय · राज्य · राष्ट्रीय", "Local · State · National")}
        title={text("खबरें और नागरिक जानकारी", "News and civic information")}
        description={text(
          "स्रोत, प्रकाशन समय और क्षेत्र के साथ खबरें। हम पूरी खबर कॉपी नहीं करते — मूल स्रोत तक ले जाते हैं।",
          "News with sources, publication times and region. We do not copy full articles — we link to the original source.",
        )}
      />
      <NewsExplorer
        articles={news.articles}
        isLive={news.isLive}
        fetchedAt={news.fetchedAt}
        initialCategory={params.category}
        feedErrors={news.errors.length}
      />
    </>
  );
}
