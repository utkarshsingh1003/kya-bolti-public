import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ReviewsExplorer } from "@/components/reviews-explorer";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "सेवा समीक्षा",
  description: "सार्वजनिक सेवाओं पर नागरिक अनुभव साझा करें और दूसरों के अनुभव पढ़ें। ये व्यक्तिगत राय हैं, सत्यापित तथ्य नहीं।",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const repo = await getRepository();
  const reviews = await repo.listReviews({ limit: 60 });
  return (
    <>
      <PageHeader
        eyebrow="नागरिक अनुभव"
        title="सार्वजनिक सेवाओं पर समीक्षा"
        description="सफ़ाई, पानी, बिजली, सड़क और अन्य सेवाओं पर अपना अनुभव साझा करें। ये व्यक्तिगत राय हैं — किसी दावे को सत्यापित तथ्य न मानें।"
      />
      <ReviewsExplorer initialReviews={reviews} />
    </>
  );
}
