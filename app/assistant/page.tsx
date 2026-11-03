import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AssistantPage } from "@/components/assistant-page";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "Public Saathi",
  description: "हिंदी में बोलकर या लिखकर खबरें, जनप्रतिनिधि, शिकायत, योजनाएँ और मतदाता जानकारी पूछें।",
  alternates: { canonical: "/assistant" },
};

export default async function AssistantRoute() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("आपका नागरिक सहायक", "Your civic assistant")}
        title="Public Saathi"
        description={text(
          "हिंदी में लिखिए या बोलिए। सहायक सीमित विषयों को समझता है और केवल सत्यापित या स्पष्ट रूप से चिह्नित जानकारी से जोड़ता है।",
          "Write or speak in Hindi. The assistant understands a limited set of topics and links only to verified or clearly labelled information.",
        )}
      />
      <AssistantPage />
    </>
  );
}
