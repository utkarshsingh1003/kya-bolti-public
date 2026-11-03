import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UpdatesExplorer } from "@/components/updates-explorer";

export const metadata: Metadata = {
  title: "सार्वजनिक अपडेट",
  description: "सत्यापित सार्वजनिक सूचनाएँ, कार्यक्रम और सरकारी योजना अपडेट।",
  alternates: { canonical: "/updates" },
};

export default function UpdatesPage() {
  return (
    <>
      <PageHeader
        eyebrow="सार्वजनिक अपडेट"
        title="सार्वजनिक अपडेट"
        description="सत्यापित सार्वजनिक सूचनाएँ, कार्यक्रम और सरकारी योजना अपडेट — स्रोत और प्रकाशन समय के साथ।"
      />
      <UpdatesExplorer />
    </>
  );
}
