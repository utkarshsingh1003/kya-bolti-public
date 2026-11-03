import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UpdatesExplorer } from "@/components/updates-explorer";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "सार्वजनिक अपडेट",
  description: "सत्यापित सार्वजनिक सूचनाएँ, कार्यक्रम और सरकारी योजना अपडेट।",
  alternates: { canonical: "/updates" },
};

export default async function UpdatesPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("सार्वजनिक अपडेट", "Public updates")}
        title={text("सार्वजनिक अपडेट", "Public updates")}
        description={text(
          "सत्यापित सार्वजनिक सूचनाएँ, कार्यक्रम और सरकारी योजना अपडेट — स्रोत और प्रकाशन समय के साथ।",
          "Verified public notices, events and government scheme updates — with sources and publication times.",
        )}
      />
      <UpdatesExplorer />
    </>
  );
}
