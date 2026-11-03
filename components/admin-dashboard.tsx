"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-context";
import { TextAreaField, TextField, SelectField } from "@/components/form-controls";
import { Alert, Badge, buttonClass, cn } from "@/components/ui";
import { IconAlert, IconCheck, IconExternal, IconShield } from "@/components/icons";
import { issueStatusLabels } from "@/lib/labels";
import type { CivicIssue, ContactMessage, Question, Report } from "@/lib/types";

type NewsSourceView = {
  id: string;
  name: string;
  feedUrl: string;
  enabled: boolean;
  language: string;
  scope: string;
  termsNote: string;
};

type PollView = {
  id: string;
  question: { hi: string; en: string };
  description: { hi: string; en: string };
  category: string;
  closesAt: string;
  status?: string;
  featured?: boolean;
  sponsored?: boolean;
  isDemo: boolean;
  createdAt: string;
  options: { id: string; label: { hi: string; en: string } }[];
};

type PollRequestView = {
  id: string;
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  category: string;
  status: string;
  adminNote: string | null;
  createdPollId: string | null;
  createdAt: string;
};

type AnnouncementView = {
  id: string;
  title: { hi: string; en: string };
  body: { hi: string; en: string };
  category: string;
  status: string;
  sourceUrl: string | null;
  publishAt: string | null;
  createdAt: string;
};

type BuzzPostView = {
  id: string;
  title: { hi: string; en: string };
  summary: { hi: string; en: string };
  body: { hi: string; en: string };
  category: string;
  platform: string;
  sourceUrl: string | null;
  status: string;
  origin: string;
  createdAt: string;
};

type AdInquiryView = {
  id: string;
  advertiserName: string;
  email: string;
  status: string;
  paymentStatus: string;
  placement: string;
  destinationUrl: string;
  campaignEnd: string | null;
  adminNote: string | null;
  createdAt: string;
};

type Overview = {
  ok?: boolean;
  storage?: string;
  stats?: { polls: number; issues: number; reviews: number; discussions: number; questions: number };
  reports?: Report[];
  issues?: CivicIssue[];
  questions?: Question[];
  contactMessages?: ContactMessage[];
  repsCount?: number;
  newsSources?: NewsSourceView[];
  pollRequests?: PollRequestView[];
  announcements?: AnnouncementView[];
  buzzPosts?: BuzzPostView[];
  adInquiries?: AdInquiryView[];
  polls?: PollView[];
  error?: string;
};

const tabs = [
  { id: "issues", hi: "समस्याएँ", en: "Issues" },
  { id: "questions", hi: "सवाल-जवाब", en: "Q&A" },
  { id: "reports", hi: "रिपोर्ट", en: "Reports" },
  { id: "contacts", hi: "संपर्क", en: "Contacts" },
  { id: "polls", hi: "पोल", en: "Polls" },
  { id: "pollRequests", hi: "पोल अनुरोध", en: "Poll requests" },
  { id: "updates", hi: "अपडेट", en: "Updates" },
  { id: "buzz", hi: "बज़", en: "Buzz" },
  { id: "ads", hi: "विज्ञापन", en: "Ads" },
  { id: "representatives", hi: "जनप्रतिनिधि", en: "Representatives" },
  { id: "sources", hi: "स्रोत", en: "Sources" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function IssueAdminRow({ issue, onSaved }: { issue: CivicIssue; onSaved: () => void }) {
  const { locale } = useLocale();
  const [status, setStatus] = useState(issue.status);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error" | "done">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: issue.id, status, note, officialComplaintUrl: url || undefined }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setState("error");
        return;
      }
      setState("done");
      setNote("");
      setUrl("");
      onSaved();
    } catch {
      setState("error");
    }
  }

  return (
    <li className="rounded-xl border border-navy-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="outline">{issue.trackingCode}</Badge>
        {issue.isDemo ? <Badge tone="gold">Demo</Badge> : null}
        <span className="ml-auto text-[0.66rem] text-navy-400">{new Date(issue.updatedAt).toLocaleDateString()}</span>
      </div>
      <p className="hindi mt-1.5 text-sm font-bold text-navy-900">{issue.title}</p>
      <p className="mt-0.5 text-[0.72rem] text-navy-500">{issue.area} · {issue.districtId}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
        <label className="block text-[0.68rem] font-bold text-navy-600">
          {locale === "hi" ? "स्थिति" : "Status"}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as CivicIssue["status"])}
            className="mt-0.5 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs"
          >
            {(Object.keys(issueStatusLabels) as CivicIssue["status"][]).map((item) => (
              <option key={item} value={item}>
                {locale === "hi" ? issueStatusLabels[item].hi : issueStatusLabels[item].en}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[0.68rem] font-bold text-navy-600">
          {locale === "hi" ? "नोट (सार्वजनिक)" : "Public note"}
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={locale === "hi" ? "कम से कम 3 अक्षर" : "At least 3 characters"}
            className="mt-0.5 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs"
          />
        </label>
        <button type="button" onClick={save} disabled={state === "saving" || note.trim().length < 3} className={buttonClass("secondary", "sm")}>
          {state === "saving" ? "…" : locale === "hi" ? "सहेजें" : "Save"}
        </button>
      </div>
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={locale === "hi" ? "आधिकारिक पोर्टल URL (वैकल्पिक)" : "Official portal URL (optional)"}
        className="mt-2 w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs"
      />
      {state === "error" ? <p className="mt-1 text-[0.68rem] text-red-700">{locale === "hi" ? "सहेजा नहीं गया।" : "Could not save."}</p> : null}
      {state === "done" ? <p className="mt-1 text-[0.68rem] text-teal-700">{locale === "hi" ? "सहेज दिया गया।" : "Saved."}</p> : null}
    </li>
  );
}

function QuestionAdminRow({ question, onSaved }: { question: Question; onSaved: () => void }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error" | "done">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/admin/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: question.id, answer, sources: [{ label, url }] }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setState("error");
        return;
      }
      setState("done");
      setOpen(false);
      onSaved();
    } catch {
      setState("error");
    }
  }

  return (
    <li className="rounded-xl border border-navy-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={question.answer ? "teal" : "gold"}>{question.answer ? "answered" : "pending"}</Badge>
        {question.isDemo ? <Badge tone="gold">Demo</Badge> : null}
        <span className="ml-auto text-[0.66rem] text-navy-400">{new Date(question.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="hindi mt-1.5 text-sm font-bold text-navy-900">{question.question}</p>
      {question.answer ? <p className="mt-1 line-clamp-2 text-[0.72rem] text-navy-600">{question.answer}</p> : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className={buttonClass("outline", "sm", "mt-2")}>
        {open ? (locale === "hi" ? "बंद करें" : "Close") : locale === "hi" ? "जवाब जोड़ें / बदलें" : "Add / edit answer"}
      </button>
      {open ? (
        <div className="mt-2 grid gap-2">
          <TextAreaField
            label={locale === "hi" ? "जवाब" : "Answer"}
            minLength={20}
            maxLength={2000}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField
              label={locale === "hi" ? "स्रोत का नाम" : "Source label"}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={locale === "hi" ? "जैसे: जनसुनवाई, उत्तर प्रदेश" : "e.g. Jansunwai, Uttar Pradesh"}
            />
            <TextField
              label={locale === "hi" ? "स्रोत URL" : "Source URL"}
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
            />
          </div>
          <p className="text-[0.66rem] text-navy-500">
            {locale === "hi" ? "आधिकारिक जवाब के लिए कम से कम एक आधिकारिक स्रोत ज़रूरी है।" : "At least one official source is required for an official answer."}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={state === "saving" || answer.trim().length < 20 || !label.trim() || !url.trim()}
            className={buttonClass("secondary", "sm", "justify-self-start")}
          >
            {state === "saving" ? "…" : locale === "hi" ? "जवाब सहेजें" : "Save answer"}
          </button>
          {state === "error" ? <p className="text-[0.68rem] text-red-700">{locale === "hi" ? "सहेजा नहीं गया।" : "Could not save."}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

export function AdminDashboard() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "unconfigured" | "error">("loading");
  const [tab, setTab] = useState<TabId>("issues");
  const [repsJson, setRepsJson] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [repState, setRepState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [repMessage, setRepMessage] = useState<string | null>(null);

  const [annTitleHi, setAnnTitleHi] = useState("");
  const [annTitleEn, setAnnTitleEn] = useState("");
  const [annBodyHi, setAnnBodyHi] = useState("");
  const [annBodyEn, setAnnBodyEn] = useState("");
  const [annCategory, setAnnCategory] = useState("notice");
  const [annStatus, setAnnStatus] = useState("draft");
  const [annSourceUrl, setAnnSourceUrl] = useState("");
  const [annPublishAt, setAnnPublishAt] = useState("");

  const [buzzTitleHi, setBuzzTitleHi] = useState("");
  const [buzzTitleEn, setBuzzTitleEn] = useState("");
  const [buzzSummaryHi, setBuzzSummaryHi] = useState("");
  const [buzzSummaryEn, setBuzzSummaryEn] = useState("");
  const [buzzBodyHi, setBuzzBodyHi] = useState("");
  const [buzzBodyEn, setBuzzBodyEn] = useState("");
  const [buzzCategory, setBuzzCategory] = useState("trending");
  const [buzzPlatform, setBuzzPlatform] = useState("youtube");
  const [buzzSourceUrl, setBuzzSourceUrl] = useState("");
  const [buzzStatus, setBuzzStatus] = useState("draft");
  const [buzzEditId, setBuzzEditId] = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      if (response.status === 401) {
        setStatus("denied");
        router.replace("/admin/login");
        return;
      }
      if (response.status === 503) {
        setStatus("unconfigured");
        return;
      }
      const result = (await response.json()) as Overview;
      if (!response.ok || !result.ok) {
        setStatus("error");
        return;
      }
      setData(result);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolveReport(targetType: "report" | "contact", targetId: string) {
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "resolve", targetType, targetId }),
    });
    void load();
  }

  async function managePollAction(id: string, action: "publish" | "close" | "archive" | "feature" | "unfeature") {
    const response = await fetch("/api/admin/polls", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = (await response.json()) as { ok?: boolean };
    if (!response.ok || !data.ok) setStatus("error");
    void load();
  }

  async function moderatePollRequest(id: string, action: "approve" | "reject" | "publish", closesAt?: string) {
    const response = await fetch("/api/admin/poll-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action === "publish" && closesAt ? { id, action, closesAt } : { id, action }),
    });
    if (!response.ok) setStatus("error");
    void load();
  }

  async function saveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      title: { hi: annTitleHi, en: annTitleEn },
      body: { hi: annBodyHi, en: annBodyEn },
      category: annCategory,
      status: annStatus,
      sourceUrl: annSourceUrl || undefined,
      publishAt: annPublishAt || undefined,
    };
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { ok?: boolean };
    if (response.ok && result.ok) void load();
  }

  async function manageAnnouncement(id: string, action: "publish" | "unpublish" | "archive" | "delete") {
    const response = await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = (await response.json()) as { ok?: boolean };
    if (!response.ok || !data.ok) setStatus("error");
    void load();
  }

  async function saveBuzz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      id: buzzEditId ?? undefined,
      title: { hi: buzzTitleHi, en: buzzTitleEn },
      summary: { hi: buzzSummaryHi, en: buzzSummaryEn },
      body: { hi: buzzBodyHi, en: buzzBodyEn },
      category: buzzCategory,
      platform: buzzPlatform,
      sourceUrl: buzzSourceUrl || undefined,
      status: buzzStatus,
    };
    const response = await fetch("/api/admin/buzz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { ok?: boolean };
    if (response.ok && result.ok) {
      setBuzzEditId(null);
      setBuzzStatus("draft");
      setBuzzTitleHi("");
      setBuzzTitleEn("");
      setBuzzSummaryHi("");
      setBuzzSummaryEn("");
      setBuzzBodyHi("");
      setBuzzBodyEn("");
      setBuzzSourceUrl("");
      void load();
    }
  }

  async function manageBuzz(id: string, action: "publish" | "unpublish" | "delete") {
    const response = await fetch("/api/admin/buzz", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = (await response.json()) as { ok?: boolean };
    if (!response.ok || !data.ok) setStatus("error");
    void load();
  }

  function startBuzzEdit(post: BuzzPostView) {
    setBuzzEditId(post.id);
    setBuzzTitleHi(post.title.hi);
    setBuzzTitleEn(post.title.en);
    setBuzzSummaryHi(post.summary.hi);
    setBuzzSummaryEn(post.summary.en);
    setBuzzBodyHi(post.body.hi);
    setBuzzBodyEn(post.body.en);
    setBuzzCategory(post.category);
    setBuzzPlatform(post.platform);
    setBuzzSourceUrl(post.sourceUrl ?? "");
    setBuzzStatus(post.status);
  }

  async function manageAd(id: string, action: "approve" | "reject" | "verify_payment" | "activate" | "pause" | "resume" | "expire") {
    const response = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!response.ok) setStatus("error");
    void load();
  }

  async function importRepresentatives(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRepState("saving");
    setRepMessage(null);
    try {
      const parsed = JSON.parse(repsJson) as unknown;
      const body = Array.isArray(parsed)
        ? { representatives: parsed, sourceNote }
        : { ...(parsed as object), sourceNote };
      const response = await fetch("/api/admin/representatives", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { ok?: boolean; imported?: number; error?: string };
      if (!response.ok || !result.ok) {
        setRepMessage(result.error ?? (locale === "hi" ? "आयात नहीं हो सका।" : "Import failed."));
        setRepState("error");
        return;
      }
      setRepMessage(locale === "hi" ? `${result.imported ?? 0} प्रविष्टियाँ आयात हुईं।` : `Imported ${result.imported ?? 0} entries.`);
      setRepState("done");
      setRepsJson("");
      void load();
    } catch {
      setRepMessage(locale === "hi" ? "JSON सही नहीं है।" : "Invalid JSON.");
      setRepState("error");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="container-page py-12">
        <p className="text-sm text-navy-500" role="status">{locale === "hi" ? "लोड हो रहा है…" : "Loading…"}</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="container-page py-12">
        <Alert tone="warning">{locale === "hi" ? "कृपया लॉगिन करें।" : "Please log in."}</Alert>
      </div>
    );
  }

  if (status === "unconfigured") {
    return (
      <div className="container-page py-12">
        <Alert tone="warning" title={locale === "hi" ? "एडमिन कॉन्फ़िगर नहीं है" : "Admin is not configured"}>
          {locale === "hi"
            ? "इस डिप्लॉयमेंट पर ADMIN_PASSWORD और ADMIN_SESSION_SECRET सेट नहीं हैं। कोई डिफ़ॉल्ट लॉगिन उपलब्ध नहीं है। SETUP.md देखें।"
            : "ADMIN_PASSWORD and ADMIN_SESSION_SECRET are not set on this deployment. No default login exists. See SETUP.md."}
        </Alert>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="container-page py-12">
        <Alert tone="danger">
          {locale === "hi" ? "एडमिन डेटा लोड नहीं हो सका।" : "Could not load admin data."}{" "}
          <button type="button" className="underline" onClick={() => void load()}>{locale === "hi" ? "फिर कोशिश करें" : "Try again"}</button>
        </Alert>
      </div>
    );
  }

  const stats = data.stats!;
  const openReports = data.reports?.filter((report) => report.status === "open") ?? [];
  const openContacts = data.contactMessages?.filter((message) => message.status === "open") ?? [];
  const pendingQuestions = data.questions?.filter((question) => !question.answer) ?? [];
  const openPollRequests = data.pollRequests?.filter((request) => request.status === "pending") ?? [];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
          <IconShield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="hindi text-2xl font-extrabold text-navy-900">{locale === "hi" ? "मॉडरेशन डैशबोर्ड" : "Moderation dashboard"}</h1>
          <p className="text-[0.72rem] text-navy-500">
            {locale === "hi" ? "स्टोरेज" : "Storage"}: <strong>{data.storage}</strong>
          </p>
        </div>
        <button type="button" onClick={logout} className={buttonClass("outline", "sm", "ml-auto")}>
          {locale === "hi" ? "लॉगआउट" : "Log out"}
        </button>
      </div>

      {data.storage === "memory" ? (
        <Alert tone="warning" className="mt-4">
          {locale === "hi"
            ? "सर्वरलेस मेमोरी मोड: मॉडरेशन बदलाव रीस्टार्ट पर मिट सकते हैं। स्थायी संग्रह के लिए PostgreSQL कॉन्फ़िगर करें।"
            : "Serverless memory mode: moderation changes may reset on restart. Configure PostgreSQL for durable storage."}
        </Alert>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: locale === "hi" ? "पोल" : "Polls", value: stats.polls },
          { label: locale === "hi" ? "समस्याएँ" : "Issues", value: stats.issues },
          { label: locale === "hi" ? "समीक्षाएँ" : "Reviews", value: stats.reviews },
          { label: locale === "hi" ? "चर्चाएँ" : "Discussions", value: stats.discussions },
          { label: locale === "hi" ? "सवाल" : "Questions", value: stats.questions },
          { label: locale === "hi" ? "प्रतिनिधि" : "Representatives", value: data.repsCount ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5">
            <p className="text-lg font-extrabold text-navy-900">{item.value}</p>
            <p className="text-[0.66rem] font-semibold text-navy-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-navy-100 pb-px hide-scrollbar" role="tablist">
        {tabs.map((item) => {
          const count =
            item.id === "reports"
              ? openReports.length
              : item.id === "contacts"
                ? openContacts.length
                : item.id === "questions"
                  ? pendingQuestions.length
                  : item.id === "pollRequests"
                    ? openPollRequests.length
                    : 0;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 rounded-t-lg px-3.5 py-2 text-xs font-bold",
                tab === item.id ? "bg-white text-brand-800 shadow-[inset_0_-2px_0_#de500d]" : "text-navy-500 hover:text-navy-800",
              )}
            >
              {locale === "hi" ? item.hi : item.en}
              {count > 0 ? <span className="ml-1 rounded-full bg-brand-100 px-1.5 text-[0.6rem] text-brand-800">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "issues" ? (
          <ul className="space-y-2.5">
            {(data.issues ?? []).map((issue) => (
              <IssueAdminRow key={issue.id} issue={issue} onSaved={() => void load()} />
            ))}
          </ul>
        ) : null}

        {tab === "questions" ? (
          <ul className="space-y-2.5">
            {(data.questions ?? []).map((question) => (
              <QuestionAdminRow key={question.id} question={question} onSaved={() => void load()} />
            ))}
          </ul>
        ) : null}

        {tab === "reports" ? (
          openReports.length === 0 ? <p className="text-sm text-navy-500">{locale === "hi" ? "कोई खुली रिपोर्ट नहीं।" : "No open reports."}</p> : (
            <ul className="space-y-2.5">
              {openReports.map((report) => (
                <li key={report.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-100 bg-white p-3.5">
                  <IconAlert className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-bold text-navy-800">{report.targetType} · {report.reason}</span>
                  <span className="text-[0.66rem] font-mono text-navy-400">{report.targetId}</span>
                  {report.details ? <span className="w-full text-[0.72rem] text-navy-600">{report.details}</span> : null}
                  <button type="button" onClick={() => void resolveReport("report", report.id)} className={buttonClass("secondary", "sm", "ml-auto")}>
                    <IconCheck className="h-3.5 w-3.5" /> {locale === "hi" ? "हल करें" : "Resolve"}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "contacts" ? (
          openContacts.length === 0 ? <p className="text-sm text-navy-500">{locale === "hi" ? "कोई खुला संदेश नहीं।" : "No open messages."}</p> : (
            <ul className="space-y-2.5">
              {openContacts.map((message) => (
                <li key={message.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{message.status}</Badge>
                    <span className="text-xs font-bold text-navy-800">{message.subject}</span>
                    <span className="ml-auto text-[0.66rem] text-navy-400">{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1.5 text-[0.78rem] leading-relaxed text-navy-700">{message.message}</p>
                  <p className="mt-1 text-[0.68rem] text-navy-500">
                    {message.name || (locale === "hi" ? "अनाम" : "Anonymous")}
                    {message.email ? <> · <a className="text-brand-700 underline" href={`mailto:${message.email}`}>{message.email}</a></> : null}
                  </p>
                  <button type="button" onClick={() => void resolveReport("contact", message.id)} className={buttonClass("secondary", "sm", "mt-2")}>
                    <IconCheck className="h-3.5 w-3.5" /> {locale === "hi" ? "हल करें" : "Resolve"}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "representatives" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <form onSubmit={importRepresentatives} className="rounded-2xl border border-navy-100 bg-white p-4">
              <h2 className="hindi text-sm font-extrabold text-navy-900">{locale === "hi" ? "आधिकारिक डेटा आयात करें" : "Import official data"}</h2>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-navy-500">
                {locale === "hi"
                  ? "केवल आधिकारिक स्रोत से सत्यापित प्रविष्टियाँ आयात करें। हर प्रविष्टि में id, name, role, constituency, stateId, officialSourceUrl और lastVerifiedAt (ISO) होना चाहिए।"
                  : "Import only entries verified from an official source. Each entry needs id, name, role, constituency, stateId, officialSourceUrl and lastVerifiedAt (ISO)."}
              </p>
              <TextAreaField
                label="JSON"
                className="mt-2"
                value={repsJson}
                onChange={(event) => setRepsJson(event.target.value)}
                placeholder={'{\n  "representatives": [ ... ]\n}'}
              />
              <TextField
                label={locale === "hi" ? "स्रोत नोट" : "Source note"}
                className="mt-2"
                value={sourceNote}
                onChange={(event) => setSourceNote(event.target.value)}
                placeholder={locale === "hi" ? "जैसे: विधानसभा सदस्य सूची, 1 नवंबर 2026" : "e.g. Assembly members list, 1 Nov 2026"}
              />
              {repMessage ? (
                <p className={cn("mt-2 text-[0.72rem]", repState === "error" ? "text-red-700" : "text-teal-700")}>{repMessage}</p>
              ) : null}
              <button type="submit" disabled={repState === "saving" || !repsJson.trim() || !sourceNote.trim()} className={buttonClass("secondary", "sm", "mt-2")}>
                {repState === "saving" ? "…" : locale === "hi" ? "आयात करें" : "Import"}
              </button>
            </form>
            <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.72rem] leading-relaxed text-amber-900">
              {locale === "hi"
                ? "नाम, दल या संपर्क का अनुमान न लगाएँ। गलत डेटा आयात करने से भरोसा टूटता है। आयात के बाद आधिकारिक पेज पर पुष्टि करें।"
                : "Never guess names, parties or contacts. Wrong data damages trust. Verify on the official page after importing."}
            </aside>
          </div>
        ) : null}

        {tab === "sources" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "समाचार स्रोत" : "News sources"}</h2>
            <ul className="mt-2 space-y-2">
              {(data.newsSources ?? []).map((source) => (
                <li key={source.id} className="rounded-xl border border-navy-100 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-navy-800">{source.name}</span>
                    <Badge tone={source.enabled ? "teal" : "neutral"}>{source.enabled ? "enabled" : "disabled"}</Badge>
                    <span className="text-[0.64rem] text-navy-400">{source.language} · {source.scope}</span>
                  </div>
                  <a href={source.feedUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-[0.68rem] text-brand-700 underline-offset-2 hover:underline">
                    {source.feedUrl} <IconExternal className="h-3 w-3" />
                  </a>
                  <p className="mt-1 text-[0.66rem] text-navy-500">{source.termsNote}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-[0.68rem] leading-relaxed text-navy-500">
              {locale === "hi"
                ? "फ़ीड रीफ़्रेश /api/cron/news से होता है और उसके लिए CRON_SECRET या स्थानीय अनुरोध ज़रूरी है। यहाँ से रीफ़्रेश नहीं होता।"
                : "Feed refresh runs through /api/cron/news and needs CRON_SECRET or a local request. It is not triggered here."}
            </p>
          </div>
        ) : null}

        {tab === "polls" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "पोल प्रबंधन" : "Poll management"}</h2>
            {(data.polls ?? []).length === 0 ? (
              <p className="mt-3 text-[0.78rem] text-navy-500">{locale === "hi" ? "कोई पोल नहीं।" : "No polls yet."}</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {(data.polls ?? []).map((poll) => (
                  <li key={poll.id} className="rounded-xl border border-navy-100 p-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-navy-800">{poll.question.hi}</span>
                      {poll.sponsored ? <Badge tone="gold">{t.polls.sponsored}</Badge> : null}
                      <span className="ml-auto text-[0.66rem] text-navy-400">{new Date(poll.closesAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => void managePollAction(poll.id, "feature")} className={buttonClass("outline", "sm")}>
                        {locale === "hi" ? "प्रमुख" : "Feature"}
                      </button>
                      <button type="button" onClick={() => void managePollAction(poll.id, "close")} className={buttonClass("outline", "sm")}>
                        {locale === "hi" ? "बंद" : "Close"}
                      </button>
                      <button type="button" onClick={() => void managePollAction(poll.id, "archive")} className={buttonClass("outline", "sm")}>
                        {locale === "hi" ? "आर्काइव" : "Archive"}
                      </button>
                      {poll.status !== "published" ? (
                        <button type="button" onClick={() => void managePollAction(poll.id, "publish")} className={buttonClass("secondary", "sm")}>
                          {locale === "hi" ? "प्रकाशित" : "Publish"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "pollRequests" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "पोल अनुरोध" : "Poll requests"}</h2>
            {(data.pollRequests ?? []).length === 0 ? (
              <p className="mt-3 text-[0.78rem] text-navy-500">{locale === "hi" ? "कोई अनुरोध नहीं।" : "No poll requests."}</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {(data.pollRequests ?? []).map((request) => (
                  <li key={request.id} className="rounded-xl border border-navy-100 p-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-navy-800">{request.questionHi}</span>
                      <Badge tone={request.status === "approved" || request.status === "published" ? "teal" : "gold"}>{request.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {request.status !== "published" && request.status !== "rejected" ? (
                        <button type="button" onClick={() => void moderatePollRequest(request.id, "approve")} className={buttonClass("secondary", "sm")}>
                          {locale === "hi" ? "स्वीकृत" : "Approve"}
                        </button>
                      ) : null}
                      {request.status !== "rejected" ? (
                        <button type="button" onClick={() => void moderatePollRequest(request.id, "reject")} className={buttonClass("outline", "sm")}>
                          {locale === "hi" ? "अस्वीकार" : "Reject"}
                        </button>
                      ) : null}
                      {request.status !== "published" ? (
                        <button type="button" onClick={() => void moderatePollRequest(request.id, "publish", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())} className={buttonClass("secondary", "sm")}>
                          {locale === "hi" ? "प्रकाशित करें" : "Publish"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "updates" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "सार्वजनिक अपडेट" : "Public updates"}</h2>
            <form onSubmit={saveAnnouncement} className="mt-3 space-y-2 rounded-xl border border-navy-100 p-3">
              <TextField label={locale === "hi" ? "शीर्षक (हिंदी)" : "Title (Hindi)"} value={annTitleHi} onChange={(event) => setAnnTitleHi(event.target.value)} maxLength={160} />
              <TextAreaField label={locale === "hi" ? "शरीर (हिंदी)" : "Body (Hindi)"} value={annBodyHi} onChange={(event) => setAnnBodyHi(event.target.value)} maxLength={4000} />
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField label={locale === "hi" ? "शीर्षक (अंग्रेज़ी)" : "Title (English)"} value={annTitleEn} onChange={(event) => setAnnTitleEn(event.target.value)} maxLength={160} />
                <TextAreaField label={locale === "hi" ? "शरीर (अंग्रेज़ी)" : "Body (English)"} value={annBodyEn} onChange={(event) => setAnnBodyEn(event.target.value)} maxLength={4000} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <SelectField label={locale === "hi" ? "श्रेणी" : "Category"} value={annCategory} onChange={(event) => setAnnCategory(event.target.value)}>
                  <option value="notice">notice</option>
                  <option value="event">event</option>
                  <option value="scheme">scheme</option>
                  <option value="alert">alert</option>
                </SelectField>
                <SelectField label={locale === "hi" ? "स्थिति" : "Status"} value={annStatus} onChange={(event) => setAnnStatus(event.target.value)}>
                  <option value="draft">draft</option>
                  <option value="scheduled">scheduled</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </SelectField>
                <TextField label={locale === "hi" ? "प्रकाशन समय" : "Publish at"} type="date" value={annPublishAt} onChange={(event) => setAnnPublishAt(event.target.value)} />
              </div>
              <TextField label={locale === "hi" ? "स्रोत URL" : "Source URL"} type="url" value={annSourceUrl} onChange={(event) => setAnnSourceUrl(event.target.value)} placeholder="https://" />
              <button type="submit" className={buttonClass("secondary", "sm")}>
                {locale === "hi" ? "सहेजें" : "Save"}
              </button>
            </form>
            <ul className="mt-3 space-y-2.5">
              {(data.announcements ?? []).map((announcement) => (
                <li key={announcement.id} className="rounded-xl border border-navy-100 p-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-navy-800">{announcement.title.hi}</span>
                    <Badge tone={announcement.status === "published" ? "teal" : "gold"}>{announcement.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {announcement.status !== "published" ? (
                      <button type="button" onClick={() => void manageAnnouncement(announcement.id, "publish")} className={buttonClass("secondary", "sm")}>
                        {locale === "hi" ? "प्रकाशित" : "Publish"}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => void manageAnnouncement(announcement.id, "archive")} className={buttonClass("outline", "sm")}>
                      {locale === "hi" ? "आर्काइव" : "Archive"}
                    </button>
                    <button type="button" onClick={() => void manageAnnouncement(announcement.id, "delete")} className={buttonClass("outline", "sm")}>
                      {locale === "hi" ? "मिटाएँ" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "buzz" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "ट्रेंडिंग बज़" : "Trending buzz"}</h2>
            <form onSubmit={saveBuzz} className="mt-3 space-y-2 rounded-xl border border-navy-100 p-3">
              <TextField label={locale === "hi" ? "शीर्षक (हिंदी)" : "Title (Hindi)"} value={buzzTitleHi} onChange={(event) => setBuzzTitleHi(event.target.value)} maxLength={160} />
              <TextField label={locale === "hi" ? "शीर्षक (अंग्रेज़ी)" : "Title (English)"} value={buzzTitleEn} onChange={(event) => setBuzzTitleEn(event.target.value)} maxLength={160} />
              <TextAreaField label={locale === "hi" ? "संक्षेप (हिंदी)" : "Summary (Hindi)"} value={buzzSummaryHi} onChange={(event) => setBuzzSummaryHi(event.target.value)} maxLength={600} />
              <TextAreaField label={locale === "hi" ? "संक्षेप (अंग्रेज़ी)" : "Summary (English)"} value={buzzSummaryEn} onChange={(event) => setBuzzSummaryEn(event.target.value)} maxLength={600} />
              <TextAreaField label={locale === "hi" ? "बॉडी (हिंदी)" : "Body (Hindi)"} value={buzzBodyHi} onChange={(event) => setBuzzBodyHi(event.target.value)} maxLength={4000} />
              <TextAreaField label={locale === "hi" ? "बॉडी (अंग्रेज़ी)" : "Body (English)"} value={buzzBodyEn} onChange={(event) => setBuzzBodyEn(event.target.value)} maxLength={4000} />
              <div className="grid gap-2 sm:grid-cols-2">
                <SelectField label={locale === "hi" ? "श्रेणी" : "Category"} value={buzzCategory} onChange={(event) => setBuzzCategory(event.target.value)}>
                  <option value="trending">trending</option>
                  <option value="news">news</option>
                  <option value="entertainment">entertainment</option>
                  <option value="sports">sports</option>
                  <option value="memes">memes</option>
                  <option value="public_issues">public_issues</option>
                </SelectField>
                <SelectField label={locale === "hi" ? "प्लेटफ़ॉर्म" : "Platform"} value={buzzPlatform} onChange={(event) => setBuzzPlatform(event.target.value)}>
                  <option value="youtube">youtube</option>
                  <option value="twitter">twitter</option>
                  <option value="instagram">instagram</option>
                  <option value="news">news</option>
                  <option value="video">video</option>
                  <option value="other">other</option>
                </SelectField>
              </div>
              <TextField label={locale === "hi" ? "स्रोत URL" : "Source URL"} type="url" value={buzzSourceUrl} onChange={(event) => setBuzzSourceUrl(event.target.value)} placeholder="https://" />
              <SelectField label={locale === "hi" ? "स्थिति" : "Status"} value={buzzStatus} onChange={(event) => setBuzzStatus(event.target.value)}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </SelectField>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                {locale === "hi" ? "सहेजें" : "Save"}
              </button>
            </form>
            <ul className="mt-3 space-y-2.5">
              {(data.buzzPosts ?? []).map((post) => (
                <li key={post.id} className="rounded-xl border border-navy-100 p-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-navy-800">{post.title.hi}</span>
                    <Badge tone={post.status === "published" ? "teal" : "gold"}>{post.status}</Badge>
                    <Badge tone="outline">{post.origin}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => startBuzzEdit(post)} className={buttonClass("outline", "sm")}>
                      {locale === "hi" ? "संपादन" : "Edit"}
                    </button>
                    {post.status !== "published" ? (
                      <button type="button" onClick={() => void manageBuzz(post.id, "publish")} className={buttonClass("secondary", "sm")}>
                        {locale === "hi" ? "प्रकाशित" : "Publish"}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => void manageBuzz(post.id, "unpublish")} className={buttonClass("outline", "sm")}>
                      {locale === "hi" ? "अनप्रकाशित" : "Unpublish"}
                    </button>
                    <button type="button" onClick={() => void manageBuzz(post.id, "delete")} className={buttonClass("outline", "sm")}>
                      {locale === "hi" ? "मिटाएँ" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "ads" ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-4">
            <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "विज्ञापन अनुरोध" : "Advertising inquiries"}</h2>
            <ul className="mt-3 space-y-2.5">
              {(data.adInquiries ?? []).map((ad) => (
                <li key={ad.id} className="rounded-xl border border-navy-100 p-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-navy-800">{ad.advertiserName}</span>
                    <Badge tone={ad.status === "active" ? "teal" : "gold"}>{ad.status}</Badge>
                    <Badge tone={ad.paymentStatus === "verified" ? "teal" : "neutral"}>{ad.paymentStatus}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ad.status !== "rejected" ? (
                      <button type="button" onClick={() => void manageAd(ad.id, "approve")} className={buttonClass("secondary", "sm")}>
                        {locale === "hi" ? "स्वीकृत" : "Approve"}
                      </button>
                    ) : null}
                    {ad.status !== "rejected" ? (
                      <button type="button" onClick={() => void manageAd(ad.id, "verify_payment")} className={buttonClass("outline", "sm")}>
                        {locale === "hi" ? "भुगतान सत्यापित" : "Verify payment"}
                      </button>
                    ) : null}
                    {ad.status !== "rejected" && ad.status !== "active" ? (
                      <button type="button" onClick={() => void manageAd(ad.id, "activate")} className={buttonClass("secondary", "sm")}>
                        {locale === "hi" ? "सक्रिय" : "Activate"}
                      </button>
                    ) : null}
                    {ad.status === "active" ? (
                      <button type="button" onClick={() => void manageAd(ad.id, "pause")} className={buttonClass("outline", "sm")}>
                        {locale === "hi" ? "पॉज़" : "Pause"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
