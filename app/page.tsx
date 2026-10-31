import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import { getNews } from "@/lib/news";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "क्या बोलती PUBLIC — जनता की बात, सबकी आवाज़",
  description:
    "स्थानीय खबरें, जनप्रतिनिधि, नागरिक पोल, सामुदायिक समस्याएँ और मुफ़्त नागरिक क्विज़ — उत्तर प्रदेश और बिहार के लिए हिंदी-पहले मंच।",
  alternates: { canonical: "/" },
};

export default async function Page() {
  const repo = await getRepository();
  const [news, stats, issues, threads] = await Promise.all([
    getNews(),
    repo.getStats(),
    repo.listIssues({ limit: 12 }),
    repo.listThreads({ limit: 12 }),
  ]);

  return (
    <HomePage
      news={news.articles}
      newsLive={news.isLive}
      newsFetchedAt={news.fetchedAt}
      issues={issues}
      threads={threads}
      stats={stats}
    />
  );
}
