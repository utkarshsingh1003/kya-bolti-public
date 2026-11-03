"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLocale } from "@/components/locale-context";
import { IconArrowRight, IconExternal, IconPin } from "@/components/icons";
import { useLocation } from "@/components/location-context";

const columns = [
  {
    titleHi: "प्लेटफ़ॉर्म",
    titleEn: "Platform",
    links: [
      { href: "/news", hi: "खबरें", en: "News" },
      { href: "/representatives", hi: "जनप्रतिनिधि", en: "Representatives" },
      { href: "/issues", hi: "नागरिक समस्याएँ", en: "Civic issues" },
      { href: "/polls", hi: "सामुदायिक पोल", en: "Polls" },
      { href: "/games", hi: "नागरिक खेल", en: "Civic games" },
      { href: "/discussions", hi: "चर्चा", en: "Discussions" },
      { href: "/updates", hi: "सार्वजनिक अपडेट", en: "Public Updates" },
      { href: "/trending", hi: "ट्रेंडिंग बज़", en: "Trending Buzz" },
    ],
  },
  {
    titleHi: "समुदाय",
    titleEn: "Community",
    links: [
      { href: "/qa", hi: "सवाल-जवाब", en: "Q&A" },
      { href: "/reviews", hi: "सेवा समीक्षा", en: "Service reviews" },
      { href: "/assistant", hi: "Public Saathi", en: "Public Saathi" },
      { href: "/search", hi: "खोजें", en: "Search" },
      { href: "/sources", hi: "स्रोत और श्रेय", en: "Sources & attribution" },
      { href: "/advertise", hi: "विज्ञापन", en: "Advertise" },
    ],
  },
  {
    titleHi: "जानकारी",
    titleEn: "Information",
    links: [
      { href: "/about", hi: "हमारे बारे में", en: "About" },
      { href: "/contact", hi: "संपर्क", en: "Contact" },
      { href: "/privacy", hi: "गोपनीयता नीति", en: "Privacy policy" },
      { href: "/terms", hi: "उपयोग की शर्तें", en: "Terms of use" },
      { href: "/corrections", hi: "सुधार नीति", en: "Corrections" },
      { href: "/guidelines", hi: "सामुदायिक दिशानिर्देश", en: "Community guidelines" },
      { href: "/account", hi: "मेरा खाता", en: "My account" },
    ],
  },
] as const;

export function SiteFooter({ dataMode }: { dataMode: string }) {
  const { locale, t } = useLocale();
  const { label, openLocation } = useLocation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-navy-800 bg-navy-950 text-navy-200">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo variant="light" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-300">{t.footer.disclaimer}</p>
            <button
              type="button"
              onClick={openLocation}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-navy-700 bg-navy-900 px-3 py-2 text-xs font-semibold text-navy-100 hover:border-navy-500"
            >
              <IconPin className="h-4 w-4 text-brand-400" />
              {label}
              <span className="text-[0.6rem] uppercase tracking-wider text-navy-400">{t.common.change}</span>
            </button>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold">
              <span className="rounded-full border border-navy-700 px-2.5 py-1">हिंदी</span>
              <span className="rounded-full border border-navy-700 px-2.5 py-1">English</span>
              <span className="rounded-full border border-navy-700 px-2.5 py-1 text-navy-400">
                {locale === "hi" ? "और भाषाएँ जल्द" : "More languages soon"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.titleEn}>
                <h2 className="hindi mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white">
                  {locale === "hi" ? column.titleHi : column.titleEn}
                </h2>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-[0.82rem] text-navy-300 transition hover:text-white"
                      >
                        {locale === "hi" ? link.hi : link.en}
                        <IconArrowRight className="h-3 w-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 border-t border-navy-800 pt-6 text-[0.72rem] leading-relaxed text-navy-400 lg:grid-cols-[1fr_auto]">
          <div>
            <p>
              © {year} क्या बोलती PUBLIC · {t.tagline}
            </p>
            <p className="mt-1">
              {locale === "hi"
                ? "स्वतंत्र नागरिक मंच। सरकारी योजनाओं और कानूनी जानकारी के लिए आधिकारिक स्रोत ही अंतिम प्रमाण हैं।"
                : "An independent civic platform. Official sources remain the final authority for government schemes and legal information."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:justify-end">
            <span className="rounded-full bg-navy-900 px-2.5 py-1 font-semibold text-navy-300">
              {locale === "hi" ? "डेटा मोड" : "Data mode"}: {dataMode}
            </span>
            <Link href="/corrections" className="hover:text-white">
              {t.footer.corrections}
            </Link>
            <Link href="/sources" className="inline-flex items-center gap-1 hover:text-white">
              {t.footer.sources} <IconExternal className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
