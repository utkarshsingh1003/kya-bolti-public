import type { Metadata } from "next";
import { getNews } from "@/lib/news";
import { NewsExplorer } from "@/components/news-explorer";
import { PageHeader } from "@/components/ui";

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
  return (
    <>
      <PageHeader
        eyebrow="स्थानीय · राज्य · राष्ट्रीय"
        title="खबरें और नागरिक जानकारी"
        description="स्रोत, प्रकाशन समय और क्षेत्र के साथ खबरें। हम पूरी खबर कॉपी नहीं करते — मूल स्रोत तक ले जाते हैं।"
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
