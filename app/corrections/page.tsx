import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "सुधार नीति",
  description: "गलत जानकारी की रिपोर्ट कैसे करें और सुधार कैसे होता है।",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return <LegalPage doc={legalDocs.corrections!} />;
}
