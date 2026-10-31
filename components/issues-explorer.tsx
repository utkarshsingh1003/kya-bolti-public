"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { Badge, ButtonLink, DemoBadge, EmptyState, buttonClass, cn } from "@/components/ui";
import { IconAlert, IconClock, IconExternal, IconPin, IconTools } from "@/components/icons";
import { categoryLabel, formatDate, issueCategoryLabels, issueStatusLabels } from "@/lib/labels";
import type { CivicIssue, IssueStatus } from "@/lib/types";

type TrackedIssue = Pick<
  CivicIssue,
  | "trackingCode"
  | "category"
  | "title"
  | "description"
  | "area"
  | "districtId"
  | "stateId"
  | "status"
  | "isDemo"
  | "createdAt"
  | "updatedAt"
  | "officialComplaintUrl"
  | "events"
>;

type TrackResponse = { ok?: boolean; issue?: TrackedIssue; error?: string };

function statusTone(status: IssueStatus): "neutral" | "gold" | "teal" | "navy" {
  if (status === "under_review") return "gold";
  if (status === "verified" || status === "resolved") return "teal";
  if (status === "forwarded") return "navy";
  return "neutral";
}

export function IssuesExplorer({
  initialIssues,
  initialCode,
}: {
  initialIssues: CivicIssue[];
  initialCode?: string;
}) {
  const { locale } = useLocale();
  const { location } = useLocation();
  const [scope, setScope] = useState<"all" | "local">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all");
  const [code, setCode] = useState(initialCode ?? "");
  const [tracked, setTracked] = useState<TrackedIssue | null>(null);
  const [trackState, setTrackState] = useState<"idle" | "loading" | "error">("idle");
  const [trackError, setTrackError] = useState<string | null>(null);

  const lookup = useCallback(
    async (rawCode: string) => {
      const value = rawCode.trim().toUpperCase();
      if (!value) {
        setTrackError(locale === "hi" ? "कृपया ट्रैकिंग कोड दर्ज करें।" : "Please enter a tracking code.");
        setTrackState("error");
        return;
      }
      setTrackState("loading");
      setTrackError(null);
      try {
        const response = await fetch(`/api/issues/track?code=${encodeURIComponent(value)}`, { cache: "no-store" });
        const data = (await response.json()) as TrackResponse;
        if (!response.ok || !data.ok || !data.issue) {
          setTracked(null);
          setTrackError(data.error ?? (locale === "hi" ? "समस्या नहीं मिली।" : "Issue not found."));
          setTrackState("error");
          return;
        }
        setTracked(data.issue);
        setTrackState("idle");
      } catch {
        setTracked(null);
        setTrackError(locale === "hi" ? "ट्रैकिंग में दिक्कत आई।" : "Tracking failed.");
        setTrackState("error");
      }
    },
    [locale],
  );

  useEffect(() => {
    if (initialCode) void lookup(initialCode);
  }, [initialCode, lookup]);

  const filtered = initialIssues.filter((issue) => {
    if (scope === "local" && issue.districtId !== location.districtId) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-navy-200 bg-white p-1" role="group" aria-label={locale === "hi" ? "क्षेत्र" : "Scope"}>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold",
                scope === "all" ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50",
              )}
              aria-pressed={scope === "all"}
            >
              {locale === "hi" ? "सभी" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setScope("local")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold",
                scope === "local" ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50",
              )}
              aria-pressed={scope === "local"}
            >
              {locale === "hi" ? "मेरा ज़िला" : "My district"}
            </button>
          </div>
          <select
            aria-label={locale === "hi" ? "स्थिति फ़िल्टर" : "Status filter"}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700"
          >
            <option value="all">{locale === "hi" ? "सभी स्थितियाँ" : "All statuses"}</option>
            {(Object.keys(issueStatusLabels) as IssueStatus[]).map((status) => (
              <option key={status} value={status}>
                {locale === "hi" ? issueStatusLabels[status].hi : issueStatusLabels[status].en}
              </option>
            ))}
          </select>
          <ButtonLink href="/issues/new" size="sm" className="ml-auto">
            <IconTools className="h-4 w-4" />
            {locale === "hi" ? "समस्या दर्ज करें" : "Report an issue"}
          </ButtonLink>
        </div>

        {scope === "local" && filtered.length === 0 ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {locale === "hi"
              ? "आपके ज़िले में अभी कोई सार्वजनिक समस्या दर्ज नहीं है। आप पहली समस्या दर्ज कर सकते हैं।"
              : "No public issues in your district yet. You can be the first to report one."}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconTools className="h-7 w-7" />}
            title={locale === "hi" ? "इस फ़िल्टर में कोई समस्या नहीं" : "No issues match this filter"}
            description={locale === "hi" ? "फ़िल्टर बदलें या नई समस्या दर्ज करें।" : "Change filters or report a new issue."}
            action={
              <ButtonLink href="/issues/new" size="sm">
                {locale === "hi" ? "समस्या दर्ज करें" : "Report an issue"}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((issue) => {
              const label = issueStatusLabels[issue.status];
              return (
                <li key={issue.id} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="outline">{categoryLabel(issueCategoryLabels, issue.category, locale)}</Badge>
                    <Badge tone={statusTone(issue.status)}>{locale === "hi" ? label.hi : label.en}</Badge>
                    {issue.isDemo ? <DemoBadge /> : null}
                    <span className="ml-auto font-mono text-[0.68rem] font-bold tracking-wide text-navy-500">
                      {issue.trackingCode}
                    </span>
                  </div>
                  <h2 className="hindi text-[1.02rem] font-extrabold leading-snug text-navy-900">{issue.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed text-navy-600">{issue.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-navy-500">
                    <span className="inline-flex items-center gap-1">
                      <IconPin className="h-3.5 w-3.5" /> {issue.area}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconClock className="h-3.5 w-3.5" /> {formatDate(issue.updatedAt, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(issue.trackingCode);
                        void lookup(issue.trackingCode);
                        document.getElementById("track-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="ml-auto font-bold text-brand-700 underline-offset-2 hover:underline"
                    >
                      {locale === "hi" ? "स्थिति देखें" : "View status"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 rounded-xl border border-navy-100 bg-white px-4 py-3 text-[0.72rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "यह मंच स्थानीय रिकॉर्ड रखता है; यह सरकारी शिकायत दर्ज होने का विकल्प नहीं है। ‘फ़ॉरवर्ड’ का अर्थ केवल यह है कि जानकारी किसी अधिकारी तक पहुँचाई गई। आधिकारिक पोर्टल पर भी शिकायत दर्ज करें।"
            : "This platform keeps a local record; it is not a substitute for official complaint registration. ‘Forwarded’ only means the information was passed to an official. Also file on the official portal."}
        </p>
      </div>

      <aside id="track-panel" className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5 lg:sticky lg:top-24">
        <h2 className="hindi text-base font-extrabold text-navy-900">{locale === "hi" ? "अपनी शिकायत ट्रैक करें" : "Track your issue"}</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-navy-500">
          {locale === "hi" ? "अपना ट्रैकिंग कोड दर्ज करें (जैसे KBP-A1B2C3)।" : "Enter your tracking code (e.g. KBP-A1B2C3)."}
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void lookup(code);
          }}
        >
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="KBP-XXXXXX"
            aria-label={locale === "hi" ? "ट्रैकिंग कोड" : "Tracking code"}
            className="min-w-0 flex-1 rounded-xl border border-navy-200 px-3 py-2 font-mono text-sm text-navy-900 placeholder:text-navy-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button type="submit" className={buttonClass("primary", "sm")} disabled={trackState === "loading"}>
            {trackState === "loading" ? "…" : locale === "hi" ? "देखें" : "Check"}
          </button>
        </form>

        {trackError ? (
          <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[0.75rem] text-red-800">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" /> {trackError}
          </p>
        ) : null}

        {tracked ? (
          <div className="mt-4 border-t border-navy-100 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={statusTone(tracked.status)}>
                {locale === "hi" ? issueStatusLabels[tracked.status].hi : issueStatusLabels[tracked.status].en}
              </Badge>
              {tracked.isDemo ? <DemoBadge /> : null}
            </div>
            <h3 className="hindi mt-2 text-sm font-bold text-navy-900">{tracked.title}</h3>
            <p className="mt-1 text-[0.7rem] text-navy-500">
              {tracked.trackingCode} · {tracked.area}
            </p>
            <ol className="mt-3 space-y-2.5">
              {tracked.events.map((event, index) => (
                <li key={`${event.createdAt}-${index}`} className="relative border-l-2 border-brand-200 pl-3">
                  <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  <p className="text-[0.72rem] font-bold text-navy-800">
                    {locale === "hi" ? issueStatusLabels[event.status].hi : issueStatusLabels[event.status].en}
                  </p>
                  <p className="text-[0.7rem] leading-relaxed text-navy-600">{event.note}</p>
                  <p className="mt-0.5 text-[0.62rem] text-navy-400">{formatDate(event.createdAt, locale)}</p>
                </li>
              ))}
            </ol>
            {tracked.officialComplaintUrl ? (
              <a
                href={tracked.officialComplaintUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-bold text-brand-700 underline-offset-2 hover:underline"
              >
                {locale === "hi" ? "आधिकारिक शिकायत पोर्टल" : "Official complaint portal"}
                <IconExternal className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-[0.65rem] leading-relaxed text-navy-400">
          {locale === "hi"
            ? "कोई फ़ोन नंबर या सटीक घर का पता सार्वजनिक न करें।"
            : "Do not post phone numbers or exact home addresses publicly."}
        </p>
        <Link href="/guidelines" className="mt-2 inline-block text-[0.68rem] font-semibold text-navy-500 underline-offset-2 hover:underline">
          {locale === "hi" ? "सामुदायिक दिशानिर्देश" : "Community guidelines"}
        </Link>
      </aside>
    </div>
  );
}
