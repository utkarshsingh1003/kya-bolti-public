import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { IssuesExplorer } from "@/components/issues-explorer";
import { getRepository } from "@/lib/store";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "नागरिक समस्याएँ",
  description: "स्थानीय सड़क, पानी, सफ़ाई, बिजली और स्ट्रीटलाइट की समस्याएँ दर्ज करें और ट्रैकिंग कोड से स्थिति देखें।",
  alternates: { canonical: "/issues" },
};

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const repo = await getRepository();
  const issues = await repo.listIssues({ limit: 60 });
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("इलाके की समस्याएँ", "Local issues")}
        title={text("नागरिक समस्याएँ", "Civic issues")}
        description={text(
          "अपने इलाके की समस्या दर्ज करें, ट्रैकिंग कोड पाएँ और स्थिति देखें। यह स्थानीय रिकॉर्ड है — आधिकारिक शिकायत पोर्टल पर भी शिकायत दर्ज करें।",
          "Report an issue in your area, get a tracking code and check its status. This is a local record — also file a complaint on the official grievance portal.",
        )}
      />
      <IssuesExplorer initialIssues={issues} initialCode={params.code?.toUpperCase()} />
    </>
  );
}
