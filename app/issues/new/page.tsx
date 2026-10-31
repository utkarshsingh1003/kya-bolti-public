import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { IssueForm } from "@/components/issue-form";

export const metadata: Metadata = {
  title: "समस्या दर्ज करें",
  description: "सड़क, पानी, सफ़ाई, बिजली या स्ट्रीटलाइट की स्थानीय समस्या दर्ज करें और ट्रैकिंग कोड पाएँ।",
  alternates: { canonical: "/issues/new" },
};

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="ट्रैकिंग कोड के साथ"
        title="स्थानीय समस्या दर्ज करें"
        description="जितनी साफ़ जानकारी देंगे, उतनी मदद होगी। कृपया निजी जानकारी न लिखें। यह स्थानीय रिकॉर्ड है — आधिकारिक शिकायत पोर्टल पर अलग से शिकायत दर्ज करें।"
      />
      <IssueForm initialCategory={params.category} />
    </>
  );
}
