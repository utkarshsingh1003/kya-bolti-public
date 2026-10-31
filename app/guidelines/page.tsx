import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "सामुदायिक दिशानिर्देश",
  description: "सुरक्षित, सभ्य और उपयोगी भागीदारी के नियम।",
  alternates: { canonical: "/guidelines" },
};

export default function GuidelinesPage() {
  return <LegalPage doc={legalDocs.guidelines!} />;
}
