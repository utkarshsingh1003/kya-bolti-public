import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { QaExplorer } from "@/components/qa-explorer";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "नागरिक सवाल-जवाब",
  description: "स्थानीय शासन और सरकारी सेवाओं के सवाल पूछें। आधिकारिक स्रोत वाले जवाब स्पष्ट रूप से चिह्नित हैं।",
  alternates: { canonical: "/qa" },
};

export default async function QaPage() {
  const repo = await getRepository();
  const questions = await repo.listQuestions({ limit: 60 });
  return (
    <>
      <PageHeader
        eyebrow="पूछिए, समझिए"
        title="नागरिक सवाल-जवाब"
        description="स्थानीय शासन, सरकारी सेवाओं और प्रक्रियाओं के सवाल पूछें। जवाब केवल तभी ‘आधिकारिक’ कहे जाते हैं जब साथ में आधिकारिक स्रोत जुड़ा हो।"
      />
      <QaExplorer initialQuestions={questions} />
    </>
  );
}
