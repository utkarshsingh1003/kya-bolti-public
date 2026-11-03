import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { PollsExplorer } from "@/components/polls-explorer";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "क्या बोलती Public",
  description:
    "गैर-आधिकारिक, गैर-वैज्ञानिक सामुदायिक पोल। स्थानीय प्राथमिकताओं पर अपनी राय दें — ये चुनाव पूर्वानुमान नहीं हैं।",
  alternates: { canonical: "/polls" },
};

export default async function PollsPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow="क्या बोलती PUBLIC"
        title={text("क्या बोलती Public", "Kya Bolti Public")}
        description={text(
          "ये अनौपचारिक पोल हैं, कोई सर्वेक्षण या चुनाव पूर्वानुमान नहीं। एक खाते से एक वोट सर्वर पर लागू होता है — नतीजे केवल इस मंच के प्रतिभागियों की राय दिखाते हैं।",
          "These are informal community polls, not surveys or election forecasts. One vote per account is enforced on the server — results reflect only the opinions of this platform's participants.",
        )}
      />
      <PollsExplorer />
    </>
  );
}
