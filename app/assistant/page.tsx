import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AssistantPage } from "@/components/assistant-page";

export const metadata: Metadata = {
  title: "जनता साथी",
  description: "हिंदी में बोलकर या लिखकर खबरें, जनप्रतिनिधि, शिकायत, योजनाएँ और मतदाता जानकारी पूछें।",
  alternates: { canonical: "/assistant" },
};

export default function AssistantRoute() {
  return (
    <>
      <PageHeader
        eyebrow="आपका नागरिक सहायक"
        title="जनता साथी"
        description="हिंदी में लिखिए या बोलिए। सहायक सीमित विषयों को समझता है और केवल सत्यापित या स्पष्ट रूप से चिह्नित जानकारी से जोड़ता है।"
      />
      <AssistantPage />
    </>
  );
}
