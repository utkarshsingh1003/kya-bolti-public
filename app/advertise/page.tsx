import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AdInquiryForm } from "@/components/ad-inquiry-form";

export const metadata: Metadata = {
  title: "विज्ञापन दें",
  description: "क्या बोलती Public पर विज्ञापन दें — पूछताछ, बजट, प्लेसमेंट और क्रिएटिव।",
  alternates: { canonical: "/advertise" },
};

export default function AdvertisePage() {
  return (
    <>
      <PageHeader eyebrow="विज्ञापन" title="विज्ञापन दें" />
      <div className="container-page pb-12">
        <AdInquiryForm />
      </div>
    </>
  );
}
