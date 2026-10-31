import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "संपर्क करें",
  description: "सुधार, साइट समस्या, साझेदारी या सुरक्षा से जुड़े संदेश भेजें।",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get("kbp_locale")?.value === "en" ? "en" : "hi";
  const text = (hi: string, en: string) => (locale === "hi" ? hi : en);

  return (
    <>
      <PageHeader
        eyebrow={text("संपर्क", "Contact")}
        title={text("हमसे बात कीजिए", "Talk to us")}
        description={text(
          "सुधार अनुरोध, साइट पर तकनीकी समस्या, सामग्री रिपोर्ट या साझेदारी के लिए संदेश भेजें। कृपया निजी जानकारी न लिखें।",
          "Send a correction request, technical problem, content report or partnership message. Please do not include private data.",
        )}
      />
      <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <ContactForm />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold text-navy-900">{text("किस बारे में लिखें?", "What to write about")}</h2>
            <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-relaxed text-navy-600">
              <li>{text("गलत तथ्य या पुरानी जानकारी का सुधार", "Correction of a wrong or outdated fact")}</li>
              <li>{text("साइट पर तकनीकी समस्या", "A technical problem on the site")}</li>
              <li>{text("अपमानजनक या नियम-विरुद्ध सामग्री", "Abusive or rule-breaking content")}</li>
              <li>{text("सुरक्षा से जुड़ी चिंता", "A security concern")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-extrabold text-amber-950">{text("आपातकाल नहीं", "Not for emergencies")}</h2>
            <p className="mt-1.5 text-[0.73rem] leading-relaxed text-amber-900">
              {text(
                "यह आपातकालीन सहायता चैनल नहीं है। तत्काल खतरे में 112 पर कॉल करें। पुलिस 100, अग्निशमन 101, एम्बुलेंस 108।",
                "This is not an emergency channel. In immediate danger call 112. Police 100, fire 101, ambulance 108.",
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{text("प्रतिक्रिया समय", "Response time")}</h2>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-navy-500">
              {text(
                "हम हर संदेश का जवाब देने का प्रयास करते हैं, लेकिन तत्काल प्रतिक्रिया की गारंटी नहीं दे सकते।",
                "We try to respond to every message but cannot guarantee an immediate reply.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
