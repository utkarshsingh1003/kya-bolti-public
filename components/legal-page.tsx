import { cookies } from "next/headers";
import { pick } from "@/lib/i18n";
import type { LegalDoc } from "@/data/content";
import type { Locale } from "@/lib/types";

export async function LegalPage({ doc }: { doc: LegalDoc }) {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get("kbp_locale")?.value === "en" ? "en" : "hi";
  const text = (value: { hi: string; en: string }) => pick(value, locale);

  return (
    <>
      <div className="border-b border-navy-100 bg-white">
        <div className="container-page py-8 sm:py-10">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-700">{text(doc.eyebrow)}</p>
          <h1 className="hindi max-w-4xl text-balance text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            {text(doc.title)}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600 sm:text-[0.95rem]">{text(doc.description)}</p>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <article className="prose-civic max-w-3xl rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-7">
          {doc.sections.map((section, index) => (
            <section key={index} className={index > 0 ? "mt-7" : undefined}>
              <h2 className="hindi !mt-0 text-lg font-extrabold text-navy-900">{text(section.heading)}</h2>
              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="text-[0.88rem] leading-relaxed text-navy-700">
                  {text(paragraph)}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="text-[0.86rem] text-navy-700">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{text(bullet)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          <p className="mt-7 rounded-xl bg-navy-50 px-4 py-3 text-[0.72rem] leading-relaxed text-navy-500">
            {locale === "hi"
              ? "यह पेज मंच की वर्तमान कार्यप्रणाली बताता है। किसी भी तथ्य की पुष्टि आधिकारिक स्रोत से करें।"
              : "This page describes how the platform currently works. Verify any fact with the official source."}
          </p>
        </article>

        <aside className="rounded-2xl border border-navy-100 bg-white p-4 lg:sticky lg:top-24">
          <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "आगे पढ़ें" : "Read next"}</h2>
          <ul className="mt-2 space-y-1.5 text-[0.75rem] font-semibold text-navy-600">
            <li><a className="hover:text-brand-700 hover:underline" href="/contact">{locale === "hi" ? "संपर्क करें" : "Contact"}</a></li>
            <li><a className="hover:text-brand-700 hover:underline" href="/guidelines">{locale === "hi" ? "सामुदायिक दिशानिर्देश" : "Community guidelines"}</a></li>
            <li><a className="hover:text-brand-700 hover:underline" href="/corrections">{locale === "hi" ? "सुधार नीति" : "Corrections policy"}</a></li>
            <li><a className="hover:text-brand-700 hover:underline" href="/sources">{locale === "hi" ? "स्रोत और श्रेय" : "Sources"}</a></li>
          </ul>
        </aside>
      </div>
    </>
  );
}
