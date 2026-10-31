"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { civicLookupLinks, roleInfo, rolesForArea, stateSources } from "@/data/representatives";
import { pick } from "@/lib/i18n";
import type { Representative, RepresentativeRole } from "@/lib/types";
import { formatDate } from "@/lib/labels";
import { Alert, Badge, buttonClass } from "@/components/ui";
import { IconAlert, IconArrowRight, IconExternal, IconInfo, IconPin, IconShield, IconUsers } from "@/components/icons";

export function RepresentativesExplorer() {
  const { locale, t } = useLocale();
  const { location, label, areaType, openLocation } = useLocation();
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ stateId: location.stateId, districtId: location.districtId });
    fetch(`/api/representatives?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { ok: boolean; representatives?: Representative[] }) => {
        if (!active) return;
        if (data.ok && data.representatives) setReps(data.representatives);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [location.stateId, location.districtId]);

  const roles = useMemo(() => rolesForArea(areaType, location.stateId), [areaType, location.stateId]);

  function sourceFor(role: RepresentativeRole): { label: string; url: string } {
    const state = stateSources[location.stateId];
    const fallback = roleInfo[role];
    if (!state) return { label: fallback.sourceLabel, url: fallback.sourceUrl };
    if (role === "mla" || role === "mlc") return { label: fallback.sourceLabel, url: state.assembly };
    if (role === "mayor" || role === "chairperson" || role === "councillor") {
      return { label: fallback.sourceLabel, url: state.urban };
    }
    if (role === "gram_pradhan") return { label: fallback.sourceLabel, url: state.rural };
    if (role === "district_magistrate") return { label: fallback.sourceLabel, url: state.statePortal };
    return { label: fallback.sourceLabel, url: fallback.sourceUrl };
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={openLocation} className={buttonClass("outline", "md")}>
          <IconPin className="h-4 w-4 text-brand-600" />
          {label}
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1.5 text-xs font-semibold text-navy-700">
          <IconUsers className="h-4 w-4" />
          {areaType === "urban" ? t.location.urban : areaType === "rural" ? t.location.rural : t.location.unknown}
        </span>
        <button type="button" onClick={openLocation} className={buttonClass("ghost", "sm")}>
          {t.common.change}
        </button>
      </div>

      {error ? (
        <div className="mb-5">
          <Alert tone="danger">{t.common.error}</Alert>
        </div>
      ) : null}

      {!loading && reps.length === 0 ? (
        <div className="mb-6">
          <Alert tone="warning" title={t.reps.notVerifiedTitle}>
            <p>{t.reps.notVerifiedBody}</p>
            <p className="mt-2 text-[0.76rem]">
              {locale === "hi"
                ? "यह पेज जानबूझकर किसी नाम का अनुमान नहीं लगाता। प्रशासक सत्यापित डेटा आयात कर सकते हैं, तब जानकारी यहाँ दिखेगी।"
                : "This page deliberately does not guess any name. Administrators can import verified data, after which it appears here."}
            </p>
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-navy-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
            <IconInfo className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="hindi text-sm font-bold text-navy-900">{t.reps.areaConfirm}</p>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-navy-600">
              {locale === "hi"
                ? "शहरी क्षेत्र में महापौर/पार्षद, ग्रामीण क्षेत्र में ग्राम प्रधान जैसे पद होते हैं। हर जगह हर पद नहीं होता — इसलिए हम भूमिका के अनुसार जानकारी दिखाते हैं।"
                : "Urban areas have mayors/councillors; rural areas have gram pradhans. Not every office exists everywhere, so we show roles by area type."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const info = roleInfo[role];
          const matches = reps.filter((rep) => rep.role === role);
          const source = sourceFor(role);
          return (
            <section key={role} className="flex flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5" aria-labelledby={`role-${role}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.15em] text-brand-700">
                    {pick(info.scope, locale)}
                  </p>
                  <h2 id={`role-${role}`} className="hindi mt-1 text-lg font-extrabold text-navy-900">
                    {pick(info.title, locale)}
                  </h2>
                </div>
                <Badge tone={matches.length ? "teal" : "gold"}>
                  {matches.length ? t.common.verified : t.common.unverified}
                </Badge>
              </div>

              <p className="mt-2 text-[0.8rem] leading-relaxed text-navy-600">{pick(info.responsibility, locale)}</p>

              <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50/70 p-3">
                {loading ? (
                  <div className="space-y-2" aria-busy="true">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-navy-200/60" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-navy-200/50" />
                  </div>
                ) : matches.length ? (
                  <div className="space-y-3">
                    {matches.map((rep) => (
                      <div key={rep.id}>
                        <p className="hindi text-sm font-bold text-navy-900">{rep.name}</p>
                        <p className="text-[0.72rem] text-navy-600">
                          {rep.constituency}
                          {rep.party ? ` · ${rep.party}` : ""}
                        </p>
                        {rep.officialContact ? (
                          <p className="mt-0.5 text-[0.7rem] text-navy-600">{rep.officialContact}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.65rem] text-navy-500">
                          <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                            <IconShield className="h-3 w-3" /> {t.common.verified}
                          </span>
                          {rep.lastVerifiedAt ? <span>{t.reps.lastVerified}: {formatDate(rep.lastVerifiedAt, locale)}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="hindi text-[0.78rem] font-bold text-navy-900">{t.reps.notVerifiedTitle}</p>
                      <p className="mt-0.5 text-[0.7rem] leading-relaxed text-navy-600">
                        {locale === "hi" ? "नाम और संपर्क अनुमान से नहीं भरे जाते।" : "Names and contacts are never guessed."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.72rem] font-bold text-brand-700 hover:underline"
                >
                  {t.reps.source} <IconExternal className="h-3 w-3" />
                </a>
                <span className="text-[0.62rem] text-navy-400">· {source.label}</span>
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="hindi text-lg font-extrabold text-navy-900">{t.reps.lookupHelp}</h2>
        <p className="mt-1 text-sm text-navy-600">
          {locale === "hi"
            ? "ये आधिकारिक पोर्टल सीधे सत्यापन के लिए हैं। पिन कोड से क्षेत्र तय न करें — मतदाता सूची/निर्वाचन आयोग से पुष्टि करें।"
            : "These are official verification portals. Do not assume a constituency from a PIN code — confirm via the electoral roll or Election Commission."}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {civicLookupLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="hindi">{pick(link.label, locale)}</span>
              <IconExternal className="h-4 w-4 shrink-0 text-navy-400" />
            </a>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-navy-950 p-5 text-white sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-brand-400">
              {locale === "hi" ? "जवाबदेही" : "Accountability"}
            </p>
            <h2 className="hindi mt-1 text-xl font-extrabold">
              {locale === "hi" ? "जनप्रतिनिधि से सवाल पूछें, स्रोत के साथ" : "Ask your representative, with sources"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-navy-300">
              {locale === "hi"
                ? "सार्वजनिक सवाल-जवाब में अपना सवाल जोड़ें। जवाब आधिकारिक स्रोत के बिना ‘असत्यापित’ रहेंगे।"
                : "Add your question to civic Q&A. Answers without official sources stay marked unverified."}
            </p>
          </div>
          <Link href="/qa" className={buttonClass("white", "md", "shrink-0")}>
            {t.qa.ask} <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
