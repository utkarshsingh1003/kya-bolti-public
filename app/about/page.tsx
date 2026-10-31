import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legalDocs } from "@/data/content";

export const metadata: Metadata = {
  title: "हमारे बारे में",
  description: "क्या बोलती PUBLIC — एक स्वतंत्र, हिंदी-पहले नागरिक मंच। हमारा उद्देश्य, सीमाएँ और पारदर्शिता।",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <LegalPage doc={legalDocs.about!} />;
}
