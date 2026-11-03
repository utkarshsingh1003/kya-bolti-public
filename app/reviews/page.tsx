import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ReviewsExplorer } from "@/components/reviews-explorer";
import { getRepository } from "@/lib/store";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "सेवा समीक्षा",
  description: "सार्वजनिक सेवाओं पर नागरिक अनुभव साझा करें और दूसरों के अनुभव पढ़ें। ये व्यक्तिगत राय हैं, सत्यापित तथ्य नहीं।",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const repo = await getRepository();
  const reviews = await repo.listReviews({ limit: 60 });
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("नागरिक अनुभव", "Citizen experience")}
        title={text("सार्वजनिक सेवाओं पर समीक्षा", "Reviews of public services")}
        description={text(
          "सफ़ाई, पानी, बिजली, सड़क और अन्य सेवाओं पर अपना अनुभव साझा करें। ये व्यक्तिगत राय हैं — किसी दावे को सत्यापित तथ्य न मानें।",
          "Share your experience with sanitation, water, electricity, roads and other services. These are personal opinions — do not treat any claim as a verified fact.",
        )}
      />
      <ReviewsExplorer initialReviews={reviews} />
    </>
  );
}
