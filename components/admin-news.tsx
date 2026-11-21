"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { TextAreaField, TextField, SelectField } from "@/components/form-controls";
import { Alert, Badge, buttonClass, cn } from "@/components/ui";
import { IconAlert, IconCheck, IconClock, IconExternal, IconNews, IconSearch } from "@/components/icons";
import type {
  ManagedNewsSource,
  NewsArticleRecord,
  NewsAutomationSettings,
  NewsCategoryRecord,
  NewsFetchLog,
  NewsSourcePolicy,
  NewsStats,
  NewsStatus,
} from "@/lib/types";

type Section =
  | "all"
  | "add"
  | "pending"
  | "scheduled"
  | "published"
  | "drafts"
  | "rejected"
  | "fetching"
  | "sources"
  | "categories"
  | "automation";

const sections: { id: Section; hi: string; en: string }[] = [
  { id: "all", hi: "सभी खबरें", en: "All news" },
  { id: "add", hi: "खबर जोड़ें", en: "Add news" },
  { id: "fetching", hi: "स्वचालित फ़ेच", en: "Auto fetching" },
  { id: "pending", hi: "स्वीकृति बाकी", en: "Pending approval" },
  { id: "scheduled", hi: "निर्धारित", en: "Scheduled" },
  { id: "published", hi: "प्रकाशित", en: "Published" },
  { id: "drafts", hi: "ड्राफ़्ट", en: "Drafts" },
  { id: "rejected", hi: "अस्वीकृत", en: "Rejected" },
  { id: "sources", hi: "स्रोत", en: "Sources" },
  { id: "categories", hi: "श्रेणियाँ", en: "Categories" },
  { id: "automation", hi: "ऑटोमेशन सेटिंग", en: "Automation settings" },
];

const statusForSection: Partial<Record<Section, NewsStatus>> = {
  pending: "pending",
  scheduled: "scheduled",
  published: "published",
  drafts: "draft",
  rejected: "rejected",
};

const statusTone: Record<NewsStatus, "neutral" | "brand" | "navy" | "teal" | "gold" | "danger" | "outline"> = {
  draft: "neutral",
  pending: "gold",
  approved: "navy",
  scheduled: "brand",
  published: "teal",
  rejected: "danger",
  failed: "danger",
};

const statusLabel: Record<NewsStatus, { hi: string; en: string }> = {
  draft: { hi: "ड्राफ़्ट", en: "Draft" },
  pending: { hi: "स्वीकृति बाकी", en: "Pending" },
  approved: { hi: "स्वीकृत", en: "Approved" },
  scheduled: { hi: "निर्धारित", en: "Scheduled" },
  published: { hi: "प्रकाशित", en: "Published" },
  rejected: { hi: "अस्वीकृत", en: "Rejected" },
  failed: { hi: "विफल", en: "Failed" },
};

const policyLabel: Record<NewsSourcePolicy, { hi: string; en: string }> = {
  manual: { hi: "मैन्युअल स्वीकृति ज़रूरी", en: "Manual approval required" },
  auto_publish: { hi: "भरोसेमंद स्रोत से ऑटो-प्रकाशन", en: "Auto-publish from trusted source" },
  fetch_only: { hi: "सिर्फ़ फ़ेच, कभी ऑटो-प्रकाशन नहीं", en: "Fetch only / never auto-publish" },
};

type Overview = {
  ok: boolean;
  articles: NewsArticleRecord[];
  total: number;
  page: number;
  limit: number;
  stats: NewsStats;
  sources: ManagedNewsSource[];
  categories: NewsCategoryRecord[];
  settings: NewsAutomationSettings;
  logs: NewsFetchLog[];
  error?: string;
};

type ArticleFormState = {
  id?: string;
  title: string;
  shortDescription: string;
  content: string;
  imageUrl: string;
  imageAlt: string;
  category: string;
  tags: string;
  author: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  language: "hi" | "en";
  featured: boolean;
  breaking: boolean;
  seoTitle: string;
  seoDescription: string;
  status: NewsStatus;
  publishAt: string;
};

function toIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return parts.replace(" ", "T");
}

function fromIstInput(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatIst(iso: string | null | undefined, locale: "hi" | "en"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function emptyForm(category = "local"): ArticleFormState {
  return {
    title: "",
    shortDescription: "",
    content: "",
    imageUrl: "",
    imageAlt: "",
    category,
    tags: "",
    author: "",
    sourceName: "Kya Bolti Public",
    sourceUrl: "",
    originalUrl: "",
    language: "hi",
    featured: false,
    breaking: false,
    seoTitle: "",
    seoDescription: "",
    status: "draft",
    publishAt: "",
  };
}

function formFromArticle(article: NewsArticleRecord): ArticleFormState {
  return {
    id: article.id,
    title: article.title.hi || article.title.en,
    shortDescription: article.shortDescription,
    content: article.content,
    imageUrl: article.imageUrl ?? "",
    imageAlt: article.imageAlt ?? "",
    category: article.category,
    tags: article.tags.join(", "),
    author: article.author ?? "",
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl ?? "",
    originalUrl: article.originalUrl ?? "",
    language: article.language,
    featured: Boolean(article.featured),
    breaking: Boolean(article.breaking),
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    status: article.status,
    publishAt: toIstInput(article.publishAt ?? article.publishedAt),
  };
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white px-3 py-2.5">
      <p className="text-[0.62rem] font-bold uppercase tracking-wide text-navy-400">{label}</p>
      <p className={cn("mt-0.5 text-lg font-extrabold text-navy-900", tone)}>{value}</p>
    </div>
  );
}

export function AdminNews() {
  const { locale } = useLocale();
  const [section, setSection] = useState<Section>("all");
  const [data, setData] = useState<Overview | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<NewsArticleRecord | null>(null);
  const [form, setForm] = useState<ArticleFormState>(() => emptyForm());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [sourceForm, setSourceForm] = useState({
    name: "",
    feedUrl: "",
    language: "hi" as "hi" | "en",
    scope: "national" as "national" | "state" | "district",
    category: "national",
    attribution: "",
    termsNote: "",
  });
  const [categoryForm, setCategoryForm] = useState({ id: "", nameHi: "", nameEn: "", sortOrder: "999" });
  const [settingsDraft, setSettingsDraft] = useState<NewsAutomationSettings | null>(null);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [section, categoryFilter, languageFilter, sort, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    const statusValue = statusForSection[section];
    if (statusValue) params.set("status", statusValue);
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (categoryFilter) params.set("category", categoryFilter);
    if (languageFilter) params.set("language", languageFilter);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    setStatus("loading");
    fetch(`/api/admin/news?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as Overview;
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setStatus("denied");
          return;
        }
        if (!response.ok || !payload.ok) {
          if (!cancelled) setStatus("error");
          if (!cancelled) setMessage({ tone: "error", text: payload.error ?? "News data could not be loaded." });
          return;
        }
        if (cancelled) return;
        setData(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage({ tone: "error", text: "Network error while loading news." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [section, debouncedQuery, categoryFilter, languageFilter, sort, page, reloadKey]);

  useEffect(() => {
    if (data?.settings) setSettingsDraft(data.settings);
  }, [data?.settings]);

  useEffect(() => {
    if (editing) setForm(formFromArticle(editing));
    else setForm((current) => (current.id ? emptyForm(data?.categories[0]?.id ?? "local") : current));
    // data.categories is stable enough for the reset default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const activeCategories = useMemo(
    () => (data?.categories ?? []).filter((category) => category.active),
    [data?.categories],
  );

  async function submitArticle(statusOverride?: NewsStatus) {
    setMessage(null);
    const finalStatus = statusOverride ?? form.status;
    if (form.title.trim().length < 8) {
      setMessage({ tone: "error", text: locale === "hi" ? "शीर्षक कम से कम 8 अक्षरों का हो।" : "Title must be at least 8 characters." });
      return;
    }
    if (form.shortDescription.trim().length < 20) {
      setMessage({ tone: "error", text: locale === "hi" ? "छोटा सारांश कम से कम 20 अक्षरों का हो।" : "Short description must be at least 20 characters." });
      return;
    }
    if (finalStatus === "scheduled" && !form.publishAt) {
      setMessage({ tone: "error", text: locale === "hi" ? "निर्धारित प्रकाशन के लिए तारीख़ और समय चुनें।" : "Choose a date and time to schedule." });
      return;
    }
    if (finalStatus === "published" && !form.content.trim() && !form.originalUrl.trim() && !form.sourceUrl.trim()) {
      setMessage({ tone: "error", text: locale === "hi" ? "प्रकाशन से पहले सामग्री या मूल लेख URL दें।" : "Add content or an original article URL before publishing." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          shortDescription: form.shortDescription,
          content: form.content,
          imageUrl: form.imageUrl,
          imageAlt: form.imageAlt,
          category: form.category,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          author: form.author,
          sourceName: form.sourceName,
          sourceUrl: form.sourceUrl,
          originalUrl: form.originalUrl,
          language: form.language,
          featured: form.featured,
          breaking: form.breaking,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          status: finalStatus,
          publishAt: finalStatus === "scheduled" ? fromIstInput(form.publishAt) : undefined,
          scheduledAt: finalStatus === "scheduled" ? fromIstInput(form.publishAt) : undefined,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; article?: NewsArticleRecord };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Article could not be saved." });
        return;
      }
      setMessage({
        tone: "ok",
        text:
          finalStatus === "scheduled"
            ? locale === "hi" ? "खबर निर्धारित समय के लिए तय हो गई।" : "Article scheduled."
            : finalStatus === "published"
              ? locale === "hi" ? "खबर प्रकाशित हो गई।" : "Article published."
              : locale === "hi" ? "खबर सहेज दी गई।" : "Article saved.",
      });
      setEditing(null);
      setForm(emptyForm(activeCategories[0]?.id ?? "local"));
      setSection(finalStatus === "published" ? "published" : finalStatus === "scheduled" ? "scheduled" : finalStatus === "pending" ? "pending" : "drafts");
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error while saving the article." });
    } finally {
      setBusy(false);
    }
  }

  async function manageArticle(id: string, action: string, extra: Record<string, unknown> = {}) {
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; publishedImmediately?: boolean };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Action failed." });
        return;
      }
      setMessage({
        tone: "ok",
        text: payload.publishedImmediately
          ? locale === "hi" ? "समय बीत चुका था, खबर तुरंत प्रकाशित की गई।" : "The time had passed, so the article was published now."
          : locale === "hi" ? "कार्रवाई पूरी हुई।" : "Action completed.",
      });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function manageSource(id: string, action: string) {
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news/sources", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Source action failed." });
        return;
      }
      setMessage({ tone: "ok", text: locale === "hi" ? "स्रोत अपडेट हुआ।" : "Source updated." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function createSource() {
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...sourceForm }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Source could not be added." });
        return;
      }
      setSourceForm({
        name: "",
        feedUrl: "",
        language: "hi",
        scope: "national",
        category: "national",
        attribution: "",
        termsNote: "",
      });
      setMessage({ tone: "ok", text: locale === "hi" ? "नया स्रोत जोड़ा गया। इसे स्वीकृत करें।" : "New source added. Approve it before it can publish." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function updateSource(source: ManagedNewsSource, patch: Partial<ManagedNewsSource>) {
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: source.id,
          name: patch.name ?? source.name,
          feedUrl: patch.feedUrl ?? source.feedUrl,
          language: patch.language ?? source.language,
          scope: patch.scope ?? source.scope,
          enabled: patch.enabled ?? source.enabled,
          attribution: patch.attribution ?? source.attribution,
          termsNote: patch.termsNote ?? source.termsNote,
          category: patch.category ?? source.category,
          trustStatus: patch.trustStatus ?? source.trustStatus,
          approvalPolicy: patch.approvalPolicy ?? source.approvalPolicy,
          autoPublish: patch.autoPublish ?? source.autoPublish,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Source could not be updated." });
        return;
      }
      setMessage({ tone: "ok", text: locale === "hi" ? "स्रोत नीति सहेजी गई।" : "Source policy saved." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function createCategory() {
    setMessage(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...categoryForm, sortOrder: Number(categoryForm.sortOrder) }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Category could not be saved." });
        return;
      }
      setCategoryForm({ id: "", nameHi: "", nameEn: "", sortOrder: "999" });
      setMessage({ tone: "ok", text: locale === "hi" ? "श्रेणी सहेजी गई।" : "Category saved." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm(locale === "hi" ? `श्रेणी "${id}" हटाएँ?` : `Delete category "${id}"?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/news/categories", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Category could not be deleted." });
        return;
      }
      setMessage({ tone: "ok", text: locale === "hi" ? "श्रेणी हटाई गई।" : "Category deleted." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    if (!settingsDraft) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/news/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Settings could not be saved." });
        return;
      }
      setMessage({ tone: "ok", text: locale === "hi" ? "ऑटोमेशन सेटिंग सहेजी गई।" : "Automation settings saved." });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function fetchNow(sourceId?: string) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/news/fetch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: string[];
        found?: number;
        created?: number;
        published?: number;
      };
      if (!response.ok) {
        setMessage({ tone: "error", text: payload.error ?? "Fetch failed." });
        return;
      }
      setMessage({
        tone: payload.ok ? "ok" : "error",
        text:
          locale === "hi"
            ? `फ़ेच: ${payload.found ?? 0} मिले, ${payload.created ?? 0} नए, ${payload.published ?? 0} प्रकाशित।${payload.errors?.length ? ` त्रुटियाँ: ${payload.errors.join("; ")}` : ""}`
            : `Fetch: ${payload.found ?? 0} found, ${payload.created ?? 0} new, ${payload.published ?? 0} published.${payload.errors?.length ? ` Errors: ${payload.errors.join("; ")}` : ""}`,
      });
      reload();
    } catch {
      setMessage({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(article: NewsArticleRecord) {
    setEditing(article);
    setSection("add");
  }

  const stats = data?.stats;
  const totalPages = data ? Math.max(Math.ceil(data.total / data.limit), 1) : 1;

  if (status === "denied") {
    return (
      <Alert tone="warning" title={locale === "hi" ? "प्रशासक लॉगिन ज़रूरी" : "Admin login required"}>
        {locale === "hi" ? "कृपया /admin/login से लॉगिन करें।" : "Please sign in at /admin/login."}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-navy-900">
            <IconNews className="h-5 w-5 text-brand-700" />
            {locale === "hi" ? "समाचार प्रबंधन" : "News management"}
          </h2>
          <p className="mt-1 max-w-2xl text-[0.74rem] leading-relaxed text-navy-500">
            {locale === "hi"
              ? "स्रोत स्वीकृति का मतलब हर खबर का स्वतः प्रकाशन नहीं है। डुप्लिकेट, अधूरी और संदिग्ध खबरें स्वीकृति कतार में रहती हैं।"
              : "Source approval is not unconditional publication. Duplicate, incomplete and suspicious articles stay in the approval queue."}
          </p>
        </div>
        <button type="button" onClick={reload} className={buttonClass("outline", "sm")} disabled={status === "loading"}>
          {locale === "hi" ? "रिफ़्रेश" : "Refresh"}
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={locale === "hi" ? "कुल खबरें" : "Total news"} value={stats.total} />
          <StatCard label={locale === "hi" ? "प्रकाशित" : "Published"} value={stats.published} tone="text-teal-700" />
          <StatCard label={locale === "hi" ? "स्वीकृति बाकी" : "Pending"} value={stats.pending} tone="text-amber-700" />
          <StatCard label={locale === "hi" ? "निर्धारित" : "Scheduled"} value={stats.scheduled} tone="text-brand-700" />
          <StatCard label={locale === "hi" ? "सक्रिय स्रोत" : "Active sources"} value={stats.activeSources} />
          <StatCard label={locale === "hi" ? "विफल फ़ेच (24घं)" : "Failed fetches (24h)"} value={stats.failedFetches} tone="text-red-700" />
        </div>
      ) : null}

      {message ? (
        <Alert tone={message.tone === "ok" ? "success" : "warning"} title={message.tone === "ok" ? (locale === "hi" ? "सफल" : "Done") : locale === "hi" ? "त्रुटि" : "Problem"}>
          {message.text}
        </Alert>
      ) : null}

      <div className="flex gap-1 overflow-x-auto border-b border-navy-100 pb-px hide-scrollbar">
        {sections.map((item) => {
          const count =
            item.id === "pending"
              ? stats?.pending
              : item.id === "scheduled"
                ? stats?.scheduled
                : item.id === "published"
                  ? stats?.published
                  : item.id === "drafts"
                    ? stats?.drafts
                    : item.id === "rejected"
                      ? stats?.rejected
                      : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                if (item.id === "add") setEditing(null);
              }}
              aria-pressed={section === item.id}
              className={cn(
                "shrink-0 rounded-t-lg px-3 py-2 text-[0.72rem] font-bold",
                section === item.id ? "bg-white text-brand-800 shadow-[inset_0_-2px_0_#de500d]" : "text-navy-500 hover:text-navy-800",
              )}
            >
              {locale === "hi" ? item.hi : item.en}
              {count ? <span className="ml-1 rounded-full bg-brand-100 px-1.5 text-[0.6rem] text-brand-800">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {section === "add" ? (
        <ArticleForm
          locale={locale}
          form={form}
          setForm={setForm}
          categories={activeCategories}
          editing={Boolean(editing)}
          busy={busy}
          onSubmit={submitArticle}
          onCancel={() => {
            setEditing(null);
            setForm(emptyForm(activeCategories[0]?.id ?? "local"));
            setSection("all");
          }}
        />
      ) : null}

      {section === "sources" ? (
        <SourcesPanel
          locale={locale}
          sources={data?.sources ?? []}
          sourceForm={sourceForm}
          setSourceForm={setSourceForm}
          busy={busy}
          onAdd={createSource}
          onManage={manageSource}
          onUpdate={updateSource}
          onFetch={(id) => fetchNow(id)}
        />
      ) : null}

      {section === "categories" ? (
        <CategoriesPanel
          locale={locale}
          categories={data?.categories ?? []}
          form={categoryForm}
          setForm={setCategoryForm}
          busy={busy}
          onAdd={createCategory}
          onDelete={deleteCategory}
        />
      ) : null}

      {section === "automation" ? (
        <AutomationPanel
          locale={locale}
          settings={settingsDraft ?? data?.settings ?? null}
          setSettings={setSettingsDraft}
          busy={busy}
          onSave={saveSettings}
        />
      ) : null}

      {section === "fetching" ? (
        <FetchingPanel locale={locale} logs={data?.logs ?? []} sources={data?.sources ?? []} busy={busy} onFetch={fetchNow} />
      ) : null}

      {section !== "add" && section !== "sources" && section !== "categories" && section !== "automation" && section !== "fetching" ? (
        <div className="space-y-3">
          <div className="grid gap-2 rounded-xl border border-navy-100 bg-white p-3 sm:grid-cols-[1fr_10rem_8rem_9rem]">
            <label className="relative block">
              <span className="sr-only">{locale === "hi" ? "खोजें" : "Search"}</span>
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={locale === "hi" ? "शीर्षक, स्रोत या टैग खोजें" : "Search title, source or tag"}
                className="min-h-9 w-full rounded-lg border border-navy-200 pl-9 pr-2 text-xs"
              />
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-h-9 rounded-lg border border-navy-200 px-2 text-xs"
              aria-label={locale === "hi" ? "श्रेणी" : "Category"}
            >
              <option value="">{locale === "hi" ? "सभी श्रेणियाँ" : "All categories"}</option>
              {(data?.categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === "hi" ? category.nameHi : category.nameEn}
                </option>
              ))}
            </select>
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value)}
              className="min-h-9 rounded-lg border border-navy-200 px-2 text-xs"
              aria-label={locale === "hi" ? "भाषा" : "Language"}
            >
              <option value="">{locale === "hi" ? "सभी भाषाएँ" : "All languages"}</option>
              <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
              <option value="en">{locale === "hi" ? "अंग्रेज़ी" : "English"}</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="min-h-9 rounded-lg border border-navy-200 px-2 text-xs"
              aria-label={locale === "hi" ? "क्रम" : "Sort"}
            >
              <option value="newest">{locale === "hi" ? "नवीनतम" : "Newest"}</option>
              <option value="oldest">{locale === "hi" ? "पुराने" : "Oldest"}</option>
              <option value="publish_at">{locale === "hi" ? "प्रकाशन समय" : "Publish time"}</option>
            </select>
          </div>

          {status === "loading" ? (
            <p className="py-6 text-center text-sm text-navy-500">{locale === "hi" ? "लोड हो रहा है…" : "Loading…"}</p>
          ) : status === "error" ? (
            <p className="py-6 text-center text-sm text-red-700">{locale === "hi" ? "डेटा लोड नहीं हुआ।" : "Could not load data."}</p>
          ) : (data?.articles ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-navy-200 bg-white px-5 py-10 text-center text-sm text-navy-500">
              {locale === "hi" ? "इस सूची में अभी कोई खबर नहीं है।" : "No articles in this list yet."}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {(data?.articles ?? []).map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  locale={locale}
                  busy={busy}
                  previewing={previewId === article.id}
                  onPreview={() => setPreviewId(previewId === article.id ? null : article.id)}
                  onEdit={() => startEdit(article)}
                  onManage={manageArticle}
                />
              ))}
            </ul>
          )}

          {data && data.total > data.limit ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-navy-500">
                {locale === "hi"
                  ? `पेज ${data.page} / ${totalPages} · कुल ${data.total}`
                  : `Page ${data.page} / ${totalPages} · ${data.total} total`}
              </span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1} className={buttonClass("outline", "sm")}>
                  {locale === "hi" ? "पिछला" : "Previous"}
                </button>
                <button type="button" onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={page >= totalPages} className={buttonClass("outline", "sm")}>
                  {locale === "hi" ? "अगला" : "Next"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ArticleForm({
  locale,
  form,
  setForm,
  categories,
  editing,
  busy,
  onSubmit,
  onCancel,
}: {
  locale: "hi" | "en";
  form: ArticleFormState;
  setForm: (updater: (current: ArticleFormState) => ArticleFormState) => void;
  categories: NewsCategoryRecord[];
  editing: boolean;
  busy: boolean;
  onSubmit: (status?: NewsStatus) => void;
  onCancel: () => void;
}) {
  const update = (patch: Partial<ArticleFormState>) => setForm((current) => ({ ...current, ...patch }));
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-navy-900">
          {editing ? (locale === "hi" ? "खबर संपादित करें" : "Edit news") : locale === "hi" ? "नई खबर जोड़ें" : "Add news"}
        </h3>
        <Badge tone={statusTone[form.status]}>{locale === "hi" ? statusLabel[form.status].hi : statusLabel[form.status].en}</Badge>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField
          label={locale === "hi" ? "शीर्षक" : "Headline / title"}
          required
          minLength={8}
          maxLength={200}
          value={form.title}
          onChange={(event) => update({ title: event.target.value })}
          className="sm:col-span-2"
        />
        <TextAreaField
          label={locale === "hi" ? "छोटा विवरण" : "Short description"}
          required
          minLength={20}
          maxLength={600}
          value={form.shortDescription}
          onChange={(event) => update({ shortDescription: event.target.value })}
          className="sm:col-span-2"
        />
        <TextAreaField
          label={locale === "hi" ? "पूरी खबर / मूल सारांश" : "Full content or original summary"}
          hint={locale === "hi" ? "कॉपीराइट: पूरा लेख कॉपी न करें" : "Do not copy the full copyrighted article"}
          maxLength={20000}
          value={form.content}
          onChange={(event) => update({ content: event.target.value })}
          className="sm:col-span-2"
        />
        <TextField
          label={locale === "hi" ? "फ़ीचर इमेज URL" : "Featured image URL"}
          type="url"
          value={form.imageUrl}
          onChange={(event) => update({ imageUrl: event.target.value })}
          placeholder="https://"
        />
        <TextField
          label={locale === "hi" ? "इमेज alt टेक्स्ट" : "Image alt text"}
          maxLength={240}
          value={form.imageAlt}
          onChange={(event) => update({ imageAlt: event.target.value })}
        />
        <SelectField
          label={locale === "hi" ? "श्रेणी" : "Category"}
          value={form.category}
          onChange={(event) => update({ category: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {locale === "hi" ? category.nameHi : category.nameEn}
            </option>
          ))}
        </SelectField>
        <TextField
          label={locale === "hi" ? "टैग (कॉमा से अलग)" : "Tags (comma separated)"}
          value={form.tags}
          onChange={(event) => update({ tags: event.target.value })}
          placeholder={locale === "hi" ? "सड़क, लखनऊ, नगर निगम" : "roads, lucknow, municipal"}
        />
        <TextField
          label={locale === "hi" ? "लेखक" : "Author"}
          maxLength={120}
          value={form.author}
          onChange={(event) => update({ author: event.target.value })}
        />
        <TextField
          label={locale === "hi" ? "मूल स्रोत का नाम" : "Original source name"}
          required
          minLength={2}
          maxLength={160}
          value={form.sourceName}
          onChange={(event) => update({ sourceName: event.target.value })}
        />
        <TextField
          label={locale === "hi" ? "मूल लेख URL" : "Original article URL"}
          type="url"
          value={form.originalUrl}
          onChange={(event) => update({ originalUrl: event.target.value })}
          placeholder="https://"
        />
        <TextField
          label={locale === "hi" ? "स्रोत लिंक (वैकल्पिक)" : "Source link (optional)"}
          type="url"
          value={form.sourceUrl}
          onChange={(event) => update({ sourceUrl: event.target.value })}
          placeholder="https://"
        />
        <SelectField
          label={locale === "hi" ? "भाषा" : "Language"}
          value={form.language}
          onChange={(event) => update({ language: event.target.value as "hi" | "en" })}
        >
          <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
          <option value="en">{locale === "hi" ? "अंग्रेज़ी" : "English"}</option>
        </SelectField>
        <SelectField
          label={locale === "hi" ? "प्रकाशन स्थिति" : "Publication status"}
          value={form.status}
          onChange={(event) => update({ status: event.target.value as NewsStatus })}
        >
          {(Object.keys(statusLabel) as NewsStatus[]).map((value) => (
            <option key={value} value={value}>
              {locale === "hi" ? statusLabel[value].hi : statusLabel[value].en}
            </option>
          ))}
        </SelectField>
        <TextField
          label={locale === "hi" ? "प्रकाशन / निर्धारित समय (IST)" : "Publish / schedule time (IST)"}
          type="datetime-local"
          value={form.publishAt}
          onChange={(event) => update({ publishAt: event.target.value })}
          hint={locale === "hi" ? "Asia/Kolkata" : "Asia/Kolkata"}
        />
        <TextField
          label={locale === "hi" ? "SEO शीर्षक" : "SEO title"}
          maxLength={70}
          value={form.seoTitle}
          onChange={(event) => update({ seoTitle: event.target.value })}
        />
        <TextField
          label={locale === "hi" ? "SEO विवरण" : "SEO description"}
          maxLength={170}
          value={form.seoDescription}
          onChange={(event) => update({ seoDescription: event.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-navy-700">
          <input type="checkbox" checked={form.featured} onChange={(event) => update({ featured: event.target.checked })} className="h-4 w-4 accent-brand-600" />
          {locale === "hi" ? "विशेष खबर" : "Featured news"}
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-navy-700">
          <input type="checkbox" checked={form.breaking} onChange={(event) => update({ breaking: event.target.checked })} className="h-4 w-4 accent-brand-600" />
          {locale === "hi" ? "ब्रेकिंग न्यूज़" : "Breaking news"}
        </label>
      </div>

      {form.imageUrl ? (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.imageUrl} alt={form.imageAlt || form.title || "preview"} className="max-h-48 rounded-xl border border-navy-100 object-cover" />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onSubmit("draft")} disabled={busy} className={buttonClass("outline", "sm")}>
          {locale === "hi" ? "ड्राफ़्ट सहेजें" : "Save as draft"}
        </button>
        <button type="button" onClick={() => onSubmit("pending")} disabled={busy} className={buttonClass("secondary", "sm")}>
          {locale === "hi" ? "स्वीकृति के लिए भेजें" : "Submit for approval"}
        </button>
        <button type="button" onClick={() => onSubmit("published")} disabled={busy} className={buttonClass("primary", "sm")}>
          {locale === "hi" ? "अभी प्रकाशित करें" : "Publish now"}
        </button>
        <button type="button" onClick={() => onSubmit("scheduled")} disabled={busy} className={buttonClass("secondary", "sm")}>
          {locale === "hi" ? "प्रकाशन निर्धारित करें" : "Schedule"}
        </button>
        {editing ? (
          <button type="button" onClick={onCancel} disabled={busy} className={buttonClass("outline", "sm")}>
            {locale === "hi" ? "रद्द करें" : "Cancel"}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[0.68rem] text-navy-500">
        {locale === "hi"
          ? "प्रकाशन से पहले शीर्षक, सारांश और सामग्री/मूल लिंक जाँचे जाते हैं। निर्धारित समय Asia/Kolkata में है।"
          : "Title, summary and content/original link are checked before publishing. Scheduled times use Asia/Kolkata."}
      </p>
    </div>
  );
}

function ArticleRow({
  article,
  locale,
  busy,
  previewing,
  onPreview,
  onEdit,
  onManage,
}: {
  article: NewsArticleRecord;
  locale: "hi" | "en";
  busy: boolean;
  previewing: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onManage: (id: string, action: string, extra?: Record<string, unknown>) => void;
}) {
  const [scheduleAt, setScheduleAt] = useState(() => toIstInput(article.publishAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString()));
  const title = locale === "hi" ? article.title.hi : article.title.en;
  const original = article.originalUrl || article.sourceUrl;

  return (
    <li className="rounded-xl border border-navy-100 bg-white p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={statusTone[article.status]}>{locale === "hi" ? statusLabel[article.status].hi : statusLabel[article.status].en}</Badge>
        {article.featured ? <Badge tone="gold">{locale === "hi" ? "विशेष" : "Featured"}</Badge> : null}
        {article.breaking ? <Badge tone="danger">{locale === "hi" ? "ब्रेकिंग" : "Breaking"}</Badge> : null}
        {article.isDemo ? <Badge tone="outline">Demo</Badge> : null}
        <span className="ml-auto text-[0.64rem] text-navy-400">
          {article.status === "scheduled"
            ? `${locale === "hi" ? "निर्धारित" : "Scheduled"}: ${formatIst(article.publishAt, locale)}`
            : formatIst(article.publishedAt ?? article.createdAt, locale)}
        </span>
      </div>
      <p className="hindi mt-1.5 text-sm font-bold leading-snug text-navy-900">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-[0.74rem] leading-relaxed text-navy-600">{article.shortDescription}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.66rem] text-navy-500">
        <span>{article.sourceName}</span>
        <span>{article.category}</span>
        <span>{article.language === "hi" ? "हिंदी" : "English"}</span>
        {article.fetchedAt ? <span>{locale === "hi" ? "फ़ेच" : "Fetched"}: {formatIst(article.fetchedAt, locale)}</span> : null}
        {original ? (
          <a href={original} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-brand-700 hover:underline">
            {locale === "hi" ? "मूल लेख" : "Original"} <IconExternal className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {previewing ? (
        <div className="mt-2 rounded-xl border border-navy-100 bg-navy-50 p-3">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.imageUrl} alt={article.imageAlt || title} className="mb-2 max-h-44 rounded-lg object-cover" />
          ) : null}
          <p className="text-[0.68rem] font-bold text-navy-700">{locale === "hi" ? "पूर्वावलोकन" : "Preview"}</p>
          <p className="mt-0.5 text-[0.72rem] leading-relaxed text-navy-600">{article.shortDescription}</p>
          {article.content ? <p className="mt-1 line-clamp-4 whitespace-pre-line text-[0.72rem] text-navy-600">{article.content}</p> : null}
          {article.status === "published" && article.slug ? (
            <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-700 hover:underline">
              {locale === "hi" ? "सार्वजनिक पेज खोलें" : "Open public page"} <IconExternal className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={onEdit} disabled={busy} className={buttonClass("outline", "sm")}>
          {locale === "hi" ? "संपादित करें" : "Edit"}
        </button>
        <button type="button" onClick={onPreview} disabled={busy} className={buttonClass("outline", "sm")}>
          {previewing ? (locale === "hi" ? "पूर्वावलोकन बंद" : "Close preview") : locale === "hi" ? "पूर्वावलोकन" : "Preview"}
        </button>
        {article.status === "pending" ? (
          <>
            <button type="button" onClick={() => onManage(article.id, "approve")} disabled={busy} className={buttonClass("primary", "sm")}>
              <IconCheck className="h-3.5 w-3.5" /> {locale === "hi" ? "स्वीकृत करें" : "Approve"}
            </button>
            <button type="button" onClick={() => onManage(article.id, "reject", { note: locale === "hi" ? "प्रशासक द्वारा अस्वीकृत" : "Rejected by admin" })} disabled={busy} className={buttonClass("outline", "sm")}>
              {locale === "hi" ? "अस्वीकार" : "Reject"}
            </button>
          </>
        ) : null}
        {article.status !== "published" ? (
          <button type="button" onClick={() => onManage(article.id, "publish")} disabled={busy} className={buttonClass("primary", "sm")}>
            {locale === "hi" ? "प्रकाशित करें" : "Publish"}
          </button>
        ) : (
          <button type="button" onClick={() => onManage(article.id, "unpublish")} disabled={busy} className={buttonClass("outline", "sm")}>
            {locale === "hi" ? "अप्रकाशित करें" : "Unpublish"}
          </button>
        )}
        {article.status === "scheduled" ? (
          <button type="button" onClick={() => onManage(article.id, "cancel_schedule")} disabled={busy} className={buttonClass("outline", "sm")}>
            {locale === "hi" ? "शेड्यूल रद्द" : "Cancel schedule"}
          </button>
        ) : null}
        <button type="button" onClick={() => onManage(article.id, article.featured ? "unfeature" : "feature")} disabled={busy} className={buttonClass("outline", "sm")}>
          {article.featured ? (locale === "hi" ? "विशेष हटाएँ" : "Unfeature") : locale === "hi" ? "विशेष बनाएँ" : "Feature"}
        </button>
        <button type="button" onClick={() => onManage(article.id, article.breaking ? "unbreaking" : "breaking")} disabled={busy} className={buttonClass("outline", "sm")}>
          {article.breaking ? (locale === "hi" ? "ब्रेकिंग हटाएँ" : "Remove breaking") : locale === "hi" ? "ब्रेकिंग बनाएँ" : "Mark breaking"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(locale === "hi" ? "यह खबर हमेशा के लिए हटाएँ?" : "Delete this article permanently?")) {
              onManage(article.id, "delete");
            }
          }}
          disabled={busy}
          className={buttonClass("outline", "sm", "text-red-700")}
        >
          {locale === "hi" ? "हटाएँ" : "Delete"}
        </button>
      </div>

      {article.status !== "published" ? (
        <div className="mt-2 flex flex-wrap items-end gap-1.5">
          <label className="text-[0.66rem] font-bold text-navy-600">
            {locale === "hi" ? "प्रकाशन समय (IST)" : "Publish time (IST)"}
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(event) => setScheduleAt(event.target.value)}
              className="mt-0.5 block rounded-lg border border-navy-200 px-2 py-1.5 text-xs"
            />
          </label>
          <button
            type="button"
            onClick={() => onManage(article.id, article.status === "pending" ? "approve_schedule" : "schedule", { publishAt: fromIstInput(scheduleAt) })}
            disabled={busy || !scheduleAt}
            className={buttonClass("secondary", "sm")}
          >
            <IconClock className="h-3.5 w-3.5" /> {locale === "hi" ? "निर्धारित करें" : "Schedule"}
          </button>
        </div>
      ) : null}
    </li>
  );
}

function SourcesPanel({
  locale,
  sources,
  sourceForm,
  setSourceForm,
  busy,
  onAdd,
  onManage,
  onUpdate,
  onFetch,
}: {
  locale: "hi" | "en";
  sources: ManagedNewsSource[];
  sourceForm: {
    name: string;
    feedUrl: string;
    language: "hi" | "en";
    scope: "national" | "state" | "district";
    category: string;
    attribution: string;
    termsNote: string;
  };
  setSourceForm: (updater: (current: typeof sourceForm) => typeof sourceForm) => void;
  busy: boolean;
  onAdd: () => void;
  onManage: (id: string, action: string) => void;
  onUpdate: (source: ManagedNewsSource, patch: Partial<ManagedNewsSource>) => void;
  onFetch: (id: string) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", feedUrl: "", attribution: "", termsNote: "" });

  function startEdit(source: ManagedNewsSource) {
    setEditId(source.id);
    setDraft({
      name: source.name,
      feedUrl: source.feedUrl,
      attribution: source.attribution,
      termsNote: source.termsNote,
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-navy-100 bg-white p-4">
        <h3 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "नया स्रोत जोड़ें" : "Add a news source"}</h3>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "नया स्रोत हमेशा अस्वीकृत (untrusted) और मैन्युअल स्वीकृति नीति के साथ जुड़ता है। केवल RSS/Atom फ़ीड या अधिकृत API URL दें।"
            : "New sources always start untrusted with manual approval. Use only legitimate RSS/Atom feeds or an authorised API URL."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <TextField label={locale === "hi" ? "स्रोत का नाम" : "Source name"} value={sourceForm.name} onChange={(event) => setSourceForm((current) => ({ ...current, name: event.target.value }))} />
          <TextField label={locale === "hi" ? "फ़ीड / API URL" : "Feed / API URL"} type="url" value={sourceForm.feedUrl} onChange={(event) => setSourceForm((current) => ({ ...current, feedUrl: event.target.value }))} placeholder="https://" />
          <SelectField label={locale === "hi" ? "भाषा" : "Language"} value={sourceForm.language} onChange={(event) => setSourceForm((current) => ({ ...current, language: event.target.value as "hi" | "en" }))}>
            <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
            <option value="en">{locale === "hi" ? "अंग्रेज़ी" : "English"}</option>
          </SelectField>
          <SelectField label={locale === "hi" ? "दायरा" : "Scope"} value={sourceForm.scope} onChange={(event) => setSourceForm((current) => ({ ...current, scope: event.target.value as typeof sourceForm.scope }))}>
            <option value="national">{locale === "hi" ? "राष्ट्रीय" : "National"}</option>
            <option value="state">{locale === "hi" ? "राज्य" : "State"}</option>
            <option value="district">{locale === "hi" ? "ज़िला" : "District"}</option>
          </SelectField>
          <TextField label={locale === "hi" ? "श्रेणी id" : "Category id"} value={sourceForm.category} onChange={(event) => setSourceForm((current) => ({ ...current, category: event.target.value }))} />
          <TextField label={locale === "hi" ? "श्रेय पाठ" : "Attribution text"} value={sourceForm.attribution} onChange={(event) => setSourceForm((current) => ({ ...current, attribution: event.target.value }))} />
          <TextAreaField label={locale === "hi" ? "नियम / शर्तें नोट" : "Terms note"} value={sourceForm.termsNote} onChange={(event) => setSourceForm((current) => ({ ...current, termsNote: event.target.value }))} className="sm:col-span-2" />
        </div>
        <button type="button" onClick={onAdd} disabled={busy || !sourceForm.name.trim() || !sourceForm.feedUrl.trim() || !sourceForm.attribution.trim() || !sourceForm.termsNote.trim()} className={buttonClass("secondary", "sm", "mt-2")}>
          {locale === "hi" ? "स्रोत जोड़ें" : "Add source"}
        </button>
      </div>

      <ul className="space-y-2.5">
        {sources.map((source) => (
          <li key={source.id} className="rounded-xl border border-navy-100 bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-navy-900">{source.name}</span>
              <Badge tone={source.trustStatus === "trusted" ? "teal" : source.trustStatus === "revoked" ? "danger" : "gold"}>
                {source.trustStatus}
              </Badge>
              <Badge tone={source.enabled ? "brand" : "neutral"}>{source.enabled ? "enabled" : "disabled"}</Badge>
              <span className="ml-auto text-[0.64rem] text-navy-400">
                {source.lastFetchedAt ? `${locale === "hi" ? "अंतिम फ़ेच" : "Last fetch"}: ${formatIst(source.lastFetchedAt, locale)}` : locale === "hi" ? "कभी फ़ेच नहीं" : "Never fetched"}
              </span>
            </div>
            <a href={source.feedUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-[0.68rem] text-brand-700 hover:underline">
              {source.feedUrl} <IconExternal className="h-3 w-3" />
            </a>
            <p className="mt-1 text-[0.68rem] text-navy-500">{source.termsNote}</p>
            {source.lastError ? (
              <p className="mt-1 flex items-start gap-1 text-[0.68rem] text-red-700">
                <IconAlert className="mt-0.5 h-3 w-3 shrink-0" /> {source.lastError}
              </p>
            ) : null}
            {editId === source.id ? (
              <div className="mt-2 grid gap-2 rounded-xl border border-navy-100 bg-navy-50 p-2.5 sm:grid-cols-2">
                <TextField label={locale === "hi" ? "स्रोत का नाम" : "Source name"} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                <TextField label={locale === "hi" ? "फ़ीड / API URL" : "Feed / API URL"} type="url" value={draft.feedUrl} onChange={(event) => setDraft((current) => ({ ...current, feedUrl: event.target.value }))} />
                <TextField label={locale === "hi" ? "श्रेय पाठ" : "Attribution text"} value={draft.attribution} onChange={(event) => setDraft((current) => ({ ...current, attribution: event.target.value }))} />
                <TextField label={locale === "hi" ? "नियम / शर्तें नोट" : "Terms note"} value={draft.termsNote} onChange={(event) => setDraft((current) => ({ ...current, termsNote: event.target.value }))} />
                <div className="flex gap-1.5 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate(source, {
                        name: draft.name,
                        feedUrl: draft.feedUrl,
                        attribution: draft.attribution,
                        termsNote: draft.termsNote,
                      });
                      setEditId(null);
                    }}
                    disabled={busy || !draft.name.trim() || !draft.feedUrl.trim() || !draft.attribution.trim() || !draft.termsNote.trim()}
                    className={buttonClass("primary", "sm")}
                  >
                    {locale === "hi" ? "बदलाव सहेजें" : "Save changes"}
                  </button>
                  <button type="button" onClick={() => setEditId(null)} disabled={busy} className={buttonClass("outline", "sm")}>
                    {locale === "hi" ? "रद्द करें" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <SelectField
                label={locale === "hi" ? "स्वीकृति नीति" : "Approval policy"}
                value={source.approvalPolicy}
                onChange={(event) => onUpdate(source, { approvalPolicy: event.target.value as NewsSourcePolicy })}
              >
                {(Object.keys(policyLabel) as NewsSourcePolicy[]).map((policy) => (
                  <option key={policy} value={policy}>
                    {locale === "hi" ? policyLabel[policy].hi : policyLabel[policy].en}
                  </option>
                ))}
              </SelectField>
              <label className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-navy-700">
                <input type="checkbox" checked={source.autoPublish} onChange={(event) => onUpdate(source, { autoPublish: event.target.checked })} className="h-4 w-4 accent-brand-600" />
                {locale === "hi" ? "ऑटो-प्रकाशन" : "Auto-publish"}
              </label>
              <label className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-navy-700">
                <input type="checkbox" checked={source.enabled} onChange={(event) => onUpdate(source, { enabled: event.target.checked })} className="h-4 w-4 accent-brand-600" />
                {locale === "hi" ? "सक्रिय" : "Enabled"}
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {source.trustStatus !== "trusted" ? (
                <button type="button" onClick={() => onManage(source.id, "approve")} disabled={busy} className={buttonClass("primary", "sm")}>
                  <IconCheck className="h-3.5 w-3.5" /> {locale === "hi" ? "स्रोत स्वीकृत करें" : "Approve source"}
                </button>
              ) : (
                <button type="button" onClick={() => onManage(source.id, "revoke")} disabled={busy} className={buttonClass("outline", "sm")}>
                  {locale === "hi" ? "स्वीकृति रद्द करें" : "Revoke approval"}
                </button>
              )}
              <button type="button" onClick={() => onManage(source.id, source.enabled ? "disable" : "enable")} disabled={busy} className={buttonClass("outline", "sm")}>
                {source.enabled ? (locale === "hi" ? "बंद करें" : "Disable") : locale === "hi" ? "चालू करें" : "Enable"}
              </button>
              <button type="button" onClick={() => onFetch(source.id)} disabled={busy} className={buttonClass("outline", "sm")}>
                {locale === "hi" ? "अभी फ़ेच करें" : "Fetch now"}
              </button>
              <button type="button" onClick={() => startEdit(source)} disabled={busy} className={buttonClass("outline", "sm")}>
                {locale === "hi" ? "विवरण बदलें" : "Edit details"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(locale === "hi" ? "स्रोत हटाएँ? मौजूदा खबरें बनी रहेंगी।" : "Delete this source? Existing articles stay.")) {
                    onManage(source.id, "delete");
                  }
                }}
                disabled={busy}
                className={buttonClass("outline", "sm", "text-red-700")}
              >
                {locale === "hi" ? "हटाएँ" : "Delete"}
              </button>
            </div>
          </li>
        ))}
        {sources.length === 0 ? (
          <li className="rounded-xl border border-dashed border-navy-200 bg-white px-5 py-8 text-center text-sm text-navy-500">
            {locale === "hi" ? "कोई स्रोत नहीं। ऊपर से जोड़ें।" : "No sources yet. Add one above."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function CategoriesPanel({
  locale,
  categories,
  form,
  setForm,
  busy,
  onAdd,
  onDelete,
}: {
  locale: "hi" | "en";
  categories: NewsCategoryRecord[];
  form: { id: string; nameHi: string; nameEn: string; sortOrder: string };
  setForm: (updater: (current: { id: string; nameHi: string; nameEn: string; sortOrder: string }) => { id: string; nameHi: string; nameEn: string; sortOrder: string }) => void;
  busy: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-navy-100 bg-white p-4">
        <h3 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "श्रेणी जोड़ें / बदलें" : "Add or update a category"}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <TextField label={locale === "hi" ? "id (अंग्रेज़ी, छोटे अक्षर)" : "id (lowercase English)"} value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} placeholder="civic" />
          <TextField label={locale === "hi" ? "क्रम" : "Sort order"} type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
          <TextField label={locale === "hi" ? "हिंदी नाम" : "Hindi name"} value={form.nameHi} onChange={(event) => setForm((current) => ({ ...current, nameHi: event.target.value }))} />
          <TextField label={locale === "hi" ? "अंग्रेज़ी नाम" : "English name"} value={form.nameEn} onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))} />
        </div>
        <button type="button" onClick={onAdd} disabled={busy || !form.id.trim() || !form.nameHi.trim() || !form.nameEn.trim()} className={buttonClass("secondary", "sm", "mt-2")}>
          {locale === "hi" ? "श्रेणी सहेजें" : "Save category"}
        </button>
      </div>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2.5">
            <span className="text-xs font-bold text-navy-800">{locale === "hi" ? category.nameHi : category.nameEn}</span>
            <Badge tone="outline">{category.id}</Badge>
            <span className="text-[0.66rem] text-navy-400">#{category.sortOrder}</span>
            {!category.active ? <Badge tone="neutral">inactive</Badge> : null}
            <button type="button" onClick={() => onDelete(category.id)} disabled={busy} className={buttonClass("outline", "sm", "ml-auto text-red-700")}>
              {locale === "hi" ? "हटाएँ" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AutomationPanel({
  locale,
  settings,
  setSettings,
  busy,
  onSave,
}: {
  locale: "hi" | "en";
  settings: NewsAutomationSettings | null;
  setSettings: (settings: NewsAutomationSettings) => void;
  busy: boolean;
  onSave: () => void;
}) {
  if (!settings) {
    return <p className="text-sm text-navy-500">{locale === "hi" ? "सेटिंग लोड हो रही है…" : "Loading settings…"}</p>;
  }
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4">
      <h3 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "समाचार ऑटोमेशन" : "News automation"}</h3>
      <div className="mt-3 space-y-3">
        <label className="flex items-start gap-2 text-xs font-semibold text-navy-800">
          <input type="checkbox" checked={settings.autoPublishEnabled} onChange={(event) => setSettings({ ...settings, autoPublishEnabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-600" />
          <span>
            {locale === "hi" ? "वैश्विक ऑटो-प्रकाशन चालू" : "Global auto-publish enabled"}
            <span className="block text-[0.68rem] font-normal text-navy-500">
              {locale === "hi"
                ? "यह केवल भरोसेमंद स्रोत + ऑटो-प्रकाशन नीति + पास होने वाली गुणवत्ता जाँच पर लागू होता है।"
                : "Applies only to trusted sources with the auto-publish policy and passing quality checks."}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs font-semibold text-navy-800">
          <input type="checkbox" checked={settings.fetchEnabled} onChange={(event) => setSettings({ ...settings, fetchEnabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-600" />
          <span>
            {locale === "hi" ? "स्वचालित फ़ेचिंग चालू" : "Automatic fetching enabled"}
            <span className="block text-[0.68rem] font-normal text-navy-500">
              {locale === "hi" ? "/api/cron/news द्वारा सर्वर-साइड फ़ेच।" : "Server-side fetch by /api/cron/news."}
            </span>
          </span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <SelectField label={locale === "hi" ? "डिफ़ॉल्ट भाषा" : "Default language"} value={settings.defaultLanguage} onChange={(event) => setSettings({ ...settings, defaultLanguage: event.target.value as "hi" | "en" })}>
            <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
            <option value="en">{locale === "hi" ? "अंग्रेज़ी" : "English"}</option>
          </SelectField>
          <TextField label={locale === "hi" ? "समय क्षेत्र" : "Timezone"} value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} hint="Asia/Kolkata" />
        </div>
        <button type="button" onClick={onSave} disabled={busy} className={buttonClass("primary", "sm")}>
          {locale === "hi" ? "सेटिंग सहेजें" : "Save settings"}
        </button>
        <p className="text-[0.68rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "निर्धारित खबरें सर्वर पर प्रकाशित होती हैं — ब्राउज़र खुला रहना ज़रूरी नहीं। /api/cron/news/publish और सार्वजनिक अनुरोध दोनों idempotent हैं।"
            : "Scheduled articles publish server-side — no browser needs to stay open. /api/cron/news/publish and public requests are both idempotent."}
        </p>
      </div>
    </div>
  );
}

function FetchingPanel({
  locale,
  logs,
  sources,
  busy,
  onFetch,
}: {
  locale: "hi" | "en";
  logs: NewsFetchLog[];
  sources: ManagedNewsSource[];
  busy: boolean;
  onFetch: (id?: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-navy-100 bg-white p-4">
        <h3 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "स्वचालित समाचार फ़ेचिंग" : "Automatic news fetching"}</h3>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "सर्वर-साइड cron हर सक्रिय स्रोत से RSS/Atom पढ़ता है, डुप्लिकेट हटाता है, नीति लागू करता है और लॉग रखता है।"
            : "The server-side cron reads RSS/Atom from every enabled source, removes duplicates, applies policy and records logs."}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onFetch()} disabled={busy || sources.length === 0} className={buttonClass("primary", "sm")}>
            {locale === "hi" ? "सभी स्रोत अभी फ़ेच करें" : "Fetch all sources now"}
          </button>
          <span className="text-[0.68rem] text-navy-500">
            {sources.filter((source) => source.enabled).length} {locale === "hi" ? "सक्रिय स्रोत" : "enabled sources"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white">
        <table className="w-full text-left text-[0.72rem]">
          <thead className="bg-navy-50 text-[0.64rem] uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-3 py-2">{locale === "hi" ? "स्रोत" : "Source"}</th>
              <th className="px-3 py-2">{locale === "hi" ? "स्थिति" : "Status"}</th>
              <th className="px-3 py-2">{locale === "hi" ? "मिले" : "Found"}</th>
              <th className="px-3 py-2">{locale === "hi" ? "नए" : "New"}</th>
              <th className="px-3 py-2">{locale === "hi" ? "प्रकाशित" : "Published"}</th>
              <th className="px-3 py-2">{locale === "hi" ? "समय" : "Time"}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-navy-50">
                <td className="px-3 py-2">
                  <span className="font-semibold text-navy-800">{log.sourceName}</span>
                  {log.error ? <span className="block text-[0.64rem] text-red-700">{log.error}</span> : null}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={log.status === "success" ? "teal" : log.status === "partial" ? "gold" : "danger"}>{log.status}</Badge>
                </td>
                <td className="px-3 py-2">{log.itemsFound}</td>
                <td className="px-3 py-2">{log.itemsNew}</td>
                <td className="px-3 py-2">{log.itemsPublished}</td>
                <td className="px-3 py-2 text-navy-500">{formatIst(log.startedAt, locale)}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-navy-500">
                  {locale === "hi" ? "अभी कोई फ़ेच लॉग नहीं।" : "No fetch logs yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
