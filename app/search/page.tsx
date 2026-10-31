import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SearchPage } from "@/components/search-page";

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
  return (
    <>
      <PageHeader
        eyebrow="खोजें"
        title="जो जानना है, खोजिए"
        description="खबर, जनप्रतिनिधि, पोल, क्विज़, समस्या या सवाल — एक ही जगह से खोजें।"
      />
      <SearchPage initialQuery={params.q ?? ""} />
    </>
  );
}
