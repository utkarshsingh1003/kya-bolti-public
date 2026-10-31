import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RepresentativesExplorer } from "@/components/representatives-explorer";

export const metadata: Metadata = {
  title: "अपने जनप्रतिनिधि को जानें",
  description:
    "सांसद, विधायक, पार्षद, महापौर और ग्राम प्रधान की भूमिकाएँ, आधिकारिक स्रोत और सत्यापन की जानकारी।",
  alternates: { canonical: "/representatives" },
};

export default function RepresentativesPage() {
  return (
    <>
      <PageHeader
        eyebrow="कौन क्या करता है?"
        title="अपने जनप्रतिनिधि को जानें"
        description="पहले अपना ज़िला और इलाका चुनें। हर पद हर जगह नहीं होता — इसलिए हम आपके क्षेत्र के अनुसार भूमिकाएँ दिखाते हैं। जहाँ सत्यापित डेटा नहीं है, वहाँ हम साफ़ बताते हैं।"
      />
      <RepresentativesExplorer />
    </>
  );
}
