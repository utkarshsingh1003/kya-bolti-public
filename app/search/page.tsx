import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SearchPage } from "@/components/search-page";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "खोजें",
  description: "खबरें, जनप्रतिनिधि, पोल, क्विज़, समस्याएँ और सवाल-जवाब खोजें।",
  alternates: { canonical: "/search" },
};

export default async function SearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("खोजें", "Search")}
        title={text("जो जानना है, खोजिए", "Find what you need")}
        description={text(
          "खबर, जनप्रतिनिधि, पोल, क्विज़, समस्या या सवाल — एक ही जगह से खोजें।",
          "Search news, representatives, polls, quizzes, issues or questions — all in one place.",
        )}
      />
      <SearchPage initialQuery={params.q ?? ""} />
    </>
  );
}
