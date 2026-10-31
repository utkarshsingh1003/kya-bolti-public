import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DiscussionsExplorer } from "@/components/discussions-explorer";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "मोहल्ला चर्चा",
  description: "अपने इलाके के नागरिक मुद्दों पर सभ्य चर्चा। स्थानीय अनुभव साझा करें, अफ़वाह नहीं।",
  alternates: { canonical: "/discussions" },
};

export default async function DiscussionsPage() {
  const repo = await getRepository();
  const threads = await repo.listThreads({ limit: 60 });
  return (
    <>
      <PageHeader
        eyebrow="मोहल्ला चर्चा"
        title="आपके इलाके की बातचीत"
        description="स्थानीय मुद्दों पर सभ्य चर्चा। कोई व्यक्तिगत हमला, धमकी, स्पैम या नफ़रत फैलाने वाली बात नहीं — सिर्फ़ अनुभव, सवाल और सुझाव।"
      />
      <DiscussionsExplorer initialThreads={threads} />
    </>
  );
}
