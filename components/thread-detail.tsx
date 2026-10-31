"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { FormStatus, SelectField, TextAreaField, TextField } from "@/components/form-controls";
import { Badge, ButtonLink, DemoBadge, buttonClass } from "@/components/ui";
import { IconAlert, IconChat, IconClock } from "@/components/icons";
import { categoryLabel, discussionCategoryLabels, relativeTime } from "@/lib/labels";
import { reportReasons } from "@/lib/validation";
import type { Reply, Thread } from "@/lib/types";

const reasonLabels: Record<(typeof reportReasons)[number], { hi: string; en: string }> = {
  abuse: { hi: "अपमान / गाली", en: "Abuse" },
  threat: { hi: "धमकी", en: "Threat" },
  hate: { hi: "नफ़रत / सांप्रदायिक भाषा", en: "Hate / communal language" },
  spam: { hi: "स्पैम", en: "Spam" },
  misinformation: { hi: "गलत जानकारी", en: "Misinformation" },
  privacy: { hi: "निजी जानकारी", en: "Private information" },
  impersonation: { hi: "किसी और का रूप धारण", en: "Impersonation" },
  other: { hi: "अन्य", en: "Other" },
};

export function ThreadDetail({ thread, initialReplies }: { thread: Thread; initialReplies: Reply[] }) {
  const { locale } = useLocale();
  const [replies, setReplies] = useState(initialReplies);
  const [body, setBody] = useState("");
  const [alias, setAlias] = useState("");
  const [replyState, setReplyState] = useState<"idle" | "sending" | "error">("idle");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "thread" | "reply"; id: string } | null>(null);
  const [reason, setReason] = useState<(typeof reportReasons)[number]>("abuse");
  const [details, setDetails] = useState("");
  const [reportState, setReportState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [reportError, setReportError] = useState<string | null>(null);

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReplyState("sending");
    setReplyError(null);
    try {
      const response = await fetch(`/api/threads/${thread.id}/replies`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, body, authorAlias: alias }),
      });
      const data = (await response.json()) as { ok?: boolean; reply?: Reply; error?: string };
      if (!response.ok || !data.ok || !data.reply) {
        setReplyError(data.error ?? (locale === "hi" ? "जवाब भेजा नहीं जा सका।" : "Could not post the reply."));
        setReplyState("error");
        return;
      }
      setReplies((current) => [...current, data.reply as Reply]);
      setBody("");
      setReplyState("idle");
    } catch {
      setReplyError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setReplyState("error");
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget) return;
    setReportState("sending");
    setReportError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: reportTarget.type,
          targetId: reportTarget.id,
          reason,
          details: details || undefined,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setReportError(data.error ?? (locale === "hi" ? "रिपोर्ट दर्ज नहीं हो सकी।" : "Could not submit the report."));
        setReportState("error");
        return;
      }
      setReportState("done");
      setDetails("");
      setReportOpen(false);
    } catch {
      setReportError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setReportState("error");
    }
  }

  function openReport(type: "thread" | "reply", id: string) {
    setReportTarget({ type, id });
    setReportOpen(true);
    setReportState("idle");
    setReportError(null);
    document.getElementById("report-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        <article className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="outline">{categoryLabel(discussionCategoryLabels, thread.category, locale)}</Badge>
            {thread.isDemo ? <DemoBadge /> : null}
            <span className="ml-auto inline-flex items-center gap-1 text-[0.7rem] text-navy-400">
              <IconClock className="h-3.5 w-3.5" /> {relativeTime(thread.createdAt, locale)}
            </span>
          </div>
          <h1 className="hindi text-balance text-2xl font-extrabold leading-tight text-navy-900">{thread.title}</h1>
          <p className="mt-1 text-[0.75rem] font-semibold text-navy-500">{thread.authorAlias}</p>
          <p className="mt-4 whitespace-pre-line text-[0.92rem] leading-relaxed text-navy-700">{thread.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => openReport("thread", thread.id)} className={buttonClass("outline", "sm")}>
              <IconAlert className="h-4 w-4" />
              {locale === "hi" ? "रिपोर्ट करें" : "Report"}
            </button>
            <ButtonLink href="/discussions" variant="ghost" size="sm">
              {locale === "hi" ? "सभी चर्चाएँ" : "All discussions"}
            </ButtonLink>
          </div>
        </article>

        <section className="mt-5" aria-labelledby="replies-heading">
          <h2 id="replies-heading" className="mb-3 flex items-center gap-2 text-base font-extrabold text-navy-900">
            <IconChat className="h-4 w-4 text-brand-600" />
            {replies.length} {locale === "hi" ? "जवाब" : "replies"}
          </h2>
          {replies.length === 0 ? (
            <p className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-6 text-center text-sm text-navy-500">
              {locale === "hi" ? "अभी कोई जवाब नहीं। पहला जवाब आप दें।" : "No replies yet. Be the first to reply."}
            </p>
          ) : (
            <ol className="space-y-2.5">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.78rem] font-bold text-navy-800">{reply.authorAlias}</span>
                    {reply.isDemo ? <DemoBadge /> : null}
                    <span className="text-[0.66rem] text-navy-400">{relativeTime(reply.createdAt, locale)}</span>
                    <button
                      type="button"
                      onClick={() => openReport("reply", reply.id)}
                      className="ml-auto text-[0.68rem] font-semibold text-navy-500 underline-offset-2 hover:underline"
                    >
                      {locale === "hi" ? "रिपोर्ट" : "Report"}
                    </button>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-[0.85rem] leading-relaxed text-navy-700">{reply.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <form onSubmit={submitReply} className="mt-5 rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
          <h2 className="hindi mb-3 text-base font-extrabold text-navy-900">{locale === "hi" ? "जवाब दें" : "Reply"}</h2>
          <div className="grid gap-3">
            <TextAreaField
              label={locale === "hi" ? "आपका जवाब" : "Your reply"}
              required
              minLength={2}
              maxLength={1000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={locale === "hi" ? "सभ्य और उपयोगी जानकारी दें।" : "Keep it civil and useful."}
            />
            <TextField
              label={locale === "hi" ? "आपका उपनाम" : "Your alias"}
              required
              minLength={2}
              maxLength={30}
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder={locale === "hi" ? "जैसे: स्थानीय निवासी" : "e.g. Local resident"}
            />
            {replyError ? <FormStatus tone="error">{replyError}</FormStatus> : null}
            <button type="submit" disabled={replyState === "sending"} className={buttonClass("primary", "md", "justify-self-start")}>
              {replyState === "sending" ? (locale === "hi" ? "भेज रहे हैं…" : "Sending…") : locale === "hi" ? "जवाब भेजें" : "Post reply"}
            </button>
          </div>
        </form>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        {reportOpen ? (
          <form id="report-panel" onSubmit={submitReport} className="rounded-2xl border border-red-200 bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "सामग्री रिपोर्ट करें" : "Report content"}</h2>
            <p className="mt-1 text-[0.7rem] text-navy-500">
              {locale === "hi" ? "हमारी टीम रिपोर्ट की समीक्षा करेगी।" : "Our team will review the report."}
            </p>
            <div className="mt-2 grid gap-2.5">
              <SelectField
                label={locale === "hi" ? "कारण" : "Reason"}
                value={reason}
                onChange={(event) => setReason(event.target.value as typeof reason)}
              >
                {reportReasons.map((item) => (
                  <option key={item} value={item}>
                    {reasonLabels[item][locale]}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                label={locale === "hi" ? "अतिरिक्त जानकारी (वैकल्पिक)" : "Additional details (optional)"}
                maxLength={500}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
              {reportError ? <FormStatus tone="error">{reportError}</FormStatus> : null}
              <div className="flex gap-2">
                <button type="submit" disabled={reportState === "sending"} className={buttonClass("danger", "sm")}>
                  {locale === "hi" ? "रिपोर्ट भेजें" : "Send report"}
                </button>
                <button type="button" onClick={() => setReportOpen(false)} className={buttonClass("ghost", "sm")}>
                  {locale === "hi" ? "रद्द" : "Cancel"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {reportState === "done" ? (
          <FormStatus tone="success">
            {locale === "hi" ? "रिपोर्ट दर्ज हो गई। धन्यवाद — हमारी टीम देखेगी।" : "Report submitted. Thank you — our team will review it."}
          </FormStatus>
        ) : null}

        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
          <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "चर्चा के नियम" : "Discussion rules"}</h2>
          <ul className="mt-2 space-y-1.5 text-[0.72rem] leading-relaxed text-navy-600">
            <li>{locale === "hi" ? "व्यक्तिगत हमला या धमकी नहीं।" : "No personal attacks or threats."}</li>
            <li>{locale === "hi" ? "सांप्रदायिक या नफ़रत भरी बात नहीं।" : "No communal or hateful language."}</li>
            <li>{locale === "hi" ? "निजी जानकारी सार्वजनिक न करें।" : "Do not post private information."}</li>
            <li>{locale === "hi" ? "अफ़वाह को तथ्य की तरह न लिखें।" : "Do not present rumours as facts."}</li>
          </ul>
          <Link href="/guidelines" className="mt-2 inline-block text-[0.7rem] font-bold text-brand-700 underline-offset-2 hover:underline">
            {locale === "hi" ? "पूरे दिशानिर्देश" : "Full guidelines"}
          </Link>
        </div>
      </aside>
    </div>
  );
}
