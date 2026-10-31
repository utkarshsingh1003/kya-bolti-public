import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "गोपनीयता नीति",
  description: "कौन-सा डेटा लिया जाता है, कहाँ सहेजा जाता है और क्यों — सरल भाषा में।",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc={legalDocs.privacy!} />;
}
