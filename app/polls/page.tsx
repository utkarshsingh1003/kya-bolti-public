import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { PollsExplorer } from "@/components/polls-explorer";

export const metadata: Metadata = {
  title: "सामुदायिक पोल",
  description:
    "गैर-आधिकारिक, गैर-वैज्ञानिक सामुदायिक पोल। स्थानीय प्राथमिकताओं पर अपनी राय दें — ये चुनाव पूर्वानुमान नहीं हैं।",
  alternates: { canonical: "/polls" },
};

export default function PollsPage() {
  return (
    <>
      <PageHeader
        eyebrow="जनता क्या कह रही है?"
        title="सामुदायिक पोल"
        description="ये अनौपचारिक पोल हैं, कोई सर्वेक्षण या चुनाव पूर्वानुमान नहीं। हर पोल में एक वोट — नतीजे केवल इस मंच के प्रतिभागियों की राय दिखाते हैं।"
      />
      <PollsExplorer />
    </>
  );
}
