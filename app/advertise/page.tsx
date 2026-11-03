import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AdInquiryForm } from "@/components/ad-inquiry-form";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "विज्ञापन दें",
  description: "क्या बोलती Public पर विज्ञापन दें — पूछताछ, बजट, प्लेसमेंट और क्रिएटिव।",
  alternates: { canonical: "/advertise" },
};

export default async function AdvertisePage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader eyebrow={text("विज्ञापन", "Advertising")} title={text("विज्ञापन दें", "Advertise with us")} />
      <div className="container-page pb-12">
        <AdInquiryForm />
      </div>
    </>
  );
}
