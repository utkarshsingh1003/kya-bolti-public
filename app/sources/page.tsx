import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "स्रोत और श्रेय",
  description: "समाचार, जनप्रतिनिधि और क्विज़ की जानकारी के स्रोत।",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  return <LegalPage doc={legalDocs.sources!} />;
}
