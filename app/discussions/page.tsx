import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DiscussionsExplorer } from "@/components/discussions-explorer";
import { getRepository } from "@/lib/store";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "मोहल्ला चर्चा",
  description: "अपने इलाके के नागरिक मुद्दों पर सभ्य चर्चा। स्थानीय अनुभव साझा करें, अफ़वाह नहीं।",
  alternates: { canonical: "/discussions" },
};

export default async function DiscussionsPage() {
  const repo = await getRepository();
  const threads = await repo.listThreads({ limit: 60 });
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("मोहल्ला चर्चा", "Neighbourhood discussion")}
        title={text("आपके इलाके की बातचीत", "Conversations in your area")}
        description={text(
          "स्थानीय मुद्दों पर सभ्य चर्चा। कोई व्यक्तिगत हमला, धमकी, स्पैम या नफ़रत फैलाने वाली बात नहीं — सिर्फ़ अनुभव, सवाल और सुझाव।",
          "Civil discussion on local issues. No personal attacks, threats, spam or hate — only experiences, questions and suggestions.",
        )}
      />
      <DiscussionsExplorer initialThreads={threads} />
    </>
  );
}
