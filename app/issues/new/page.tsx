import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { IssueForm } from "@/components/issue-form";
import { getServerLocale, textFor } from "@/lib/server-locale";

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
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("ट्रैकिंग कोड के साथ", "With a tracking code")}
        title={text("स्थानीय समस्या दर्ज करें", "Report a local issue")}
        description={text(
          "जितनी साफ़ जानकारी देंगे, उतनी मदद होगी। कृपया निजी जानकारी न लिखें। यह स्थानीय रिकॉर्ड है — आधिकारिक शिकायत पोर्टल पर अलग से शिकायत दर्ज करें।",
          "The clearer the details, the more useful the report. Please do not include private information. This is a local record — also file a complaint separately on the official grievance portal.",
        )}
      />
      <IssueForm initialCategory={params.category} />
    </>
  );
}
