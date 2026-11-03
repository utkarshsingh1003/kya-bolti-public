import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RepresentativesExplorer } from "@/components/representatives-explorer";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "अपने जनप्रतिनिधि को जानें",
  description:
    "सांसद, विधायक, पार्षद, महापौर और ग्राम प्रधान की भूमिकाएँ, आधिकारिक स्रोत और सत्यापन की जानकारी।",
  alternates: { canonical: "/representatives" },
};

export default async function RepresentativesPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("कौन क्या करता है?", "Who does what?")}
        title={text("अपने जनप्रतिनिधि को जानें", "Know your representatives")}
        description={text(
          "पहले अपना ज़िला और इलाका चुनें। हर पद हर जगह नहीं होता — इसलिए हम आपके क्षेत्र के अनुसार भूमिकाएँ दिखाते हैं। जहाँ सत्यापित डेटा नहीं है, वहाँ हम साफ़ बताते हैं।",
          "First choose your district and area. Not every post exists everywhere — so we show roles relevant to your region. Where verified data is unavailable, we say so clearly.",
        )}
      />
      <RepresentativesExplorer />
    </>
  );
}
