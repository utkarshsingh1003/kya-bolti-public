import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { BuzzExplorer } from "@/components/buzz-explorer";
import { BuzzLinkForm } from "@/components/buzz-link-form";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "ट्रेंडिंग बज़",
  description: "संपादकीय रूप से स्वीकृत ट्रेंडिंग बज़, खबरें और सार्वजनिक मुद्दे।",
  alternates: { canonical: "/trending" },
};

export default async function TrendingPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("ट्रेंडिंग बज़", "Trending buzz")}
        title="Trending Buzz"
        description={text(
          "संपादकीय रूप से स्वीकृत ट्रेंडिंग बज़ — खबरें, मनोरंजन, खेल और सार्वजनिक मुद्दों से, मूल स्रोत सहित।",
          "Editorially approved trending buzz — from news, entertainment, sports and public issues, with original sources.",
        )}
      />
      <BuzzExplorer />
      <div className="container-page pb-12">
        <BuzzLinkForm />
      </div>
    </>
  );
}
