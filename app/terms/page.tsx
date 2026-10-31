import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "उपयोग की शर्तें",
  description: "मंच के उपयोग, सामग्री और उपलब्धता के सामान्य नियम।",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc={legalDocs.terms!} />;
}
