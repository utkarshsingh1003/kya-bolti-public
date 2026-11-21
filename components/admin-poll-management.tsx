"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-context";
import { Alert, Badge, buttonClass, cn } from "@/components/ui";
import { SelectField, TextField, TextAreaField } from "@/components/form-controls";
import { IconPoll, IconCheck, IconAlert, IconInfo } from "@/components/icons";
import { logAuditAction } from "@/lib/audit-log";
import { PollApprovalActions } from "@/components/poll-approval-actions";

type PollManagementTab =
  | "allPolls"
  | "addPoll"
  | "pendingApproval"
  | "scheduled"
  | "published"
  | "drafts"
  | "rejected"
  | "archived"
  | "sources"
  | "categories"
  | "analytics"
  | "automation";

const tabManagement: Record<PollManagementTab, { hi: string; en: string }> = {
  allPolls: { hi: "सभी पोल", en: "All Polls" },
  addPoll: { hi: "पोल जोड़ें", en: "Add Poll" },
  pendingApproval: { hi: "लंबित स्वीकृति", en: "Pending Approval" },
  scheduled: { hi: "निर्धारित", en: "Scheduled" },
  published: { hi: "प्रकाशित", en: "Published" },
  drafts: { hi: "ड्राफ्ट", en: "Drafts" },
  rejected: { hi: "अस्वीकृत", en: "Rejected" },
  archived: { hi: "आर्काइव", en: "Archived" },
  sources: { hi: "स्रोत/प्रदाता", en: "Sources/Providers" },
  categories: { hi: "वर्गियाँ", en: "Categories" },
  analytics: { hi: "सांख्यिकी", en: "Analytics" },
  automation: { hi: "स्वचालित設定", en: "Automation Settings" },
};

type PollStatus = "draft" | "published" | "closed" | "archived" | "scheduled";
type PollRequestStatus = "pending" | "approved" | "rejected" | "published";

type Poll = {
  id: string;
  question: { hi: string; en: string };
  description: { hi: string; en: string };
  category: string;
  closesAt: string;
  status?: PollStatus;
  featured?: boolean;
  sponsored?: boolean;
  sponsorLabel?: { hi: string; en: string } | null;
  isDemo: boolean;
  createdAt: string;
  options: { id: string; label: { hi: string; en: string } }[];
};

type PollRequest = {
  id: string;
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  category: string;
  purpose: string;
  contact: string | null;
  stateId: string | null;
  districtId: string | null;
  status: PollRequestStatus;
  adminNote: string | null;
  createdPollId: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Overview = {
  stats?: { polls: number; issues: number; reviews: number; discussions: number; questions: number };
  polls?: Poll[];
  pollRequests?: PollRequest[];
};

// ============================================================
// Tab Component
// ============================================================

function PollTabNav({ locale }: { locale: "hi" | "en" }) {
  const tabs: Array<{ id: PollManagementTab; hi: string; en: string }> = [
    { id: "allPolls", hi: "सभी पोल", en: "All Polls" },
    { id: "addPoll", hi: "पोल जोड़ें", en: "Add Poll" },
    { id: "pendingApproval", hi: "लंबित स्वीकृति", en: "Pending Approval" },
    { id: "scheduled", hi: "निर्धारित", en: "Scheduled" },
    { id: "published", hi: "प्रकाशित", en: "Published" },
    { id: "drafts", hi: "ड्राफ्ट", en: "Drafts" },
    { id: "rejected", hi: "अस्वीकृत", en: "Rejected" },
    { id: "archived", hi: "आर्काइव", en: "Archived" },
    { id: "sources", hi: "स्रोत/प्रदाता", en: "Sources/Providers" },
    { id: "categories", hi: "वर्गियाँ", en: "Categories" },
    { id: "analytics", hi: "सांख्यिकी", en: "Analytics" },
    { id: "automation", hi: "स्वचालित設定", en: "Automation Settings" },
  ];

  const [activeTab, setActiveTab] = useState<PollManagementTab>("allPolls");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-t-lg px-3 py-2 text-xs font-bold",
              activeTab === tab.id ? "bg-white text-brand-800 shadow-[inset_0_-2px_0_#de500d]" : "text-navy-500 hover:text-navy-800",
            )}
          >
            {locale === "hi" ? tab.hi : tab.en}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "allPolls" && <AllPollsTable locale={locale} />}
      {activeTab === "addPoll" && <AddPollForm locale={locale} />}
      {activeTab === "pendingApproval" && <PendingApprovalTable locale={locale} />}
      {activeTab === "scheduled" && <ScheduledTable locale={locale} />}
      {activeTab === "published" && <PublishedTable locale={locale} />}
      {activeTab === "drafts" && <DraftsTable locale={locale} />}
      {activeTab === "rejected" && <RejectedTable locale={locale} />}
      {activeTab === "archived" && <ArchivedTable locale={locale} />}
      {activeTab === "sources" && <SourcesProvidersTable locale={locale} />}
      {activeTab === "categories" && <CategoriesTable locale={locale} />}
      {activeTab === "analytics" && <AnalyticsTable locale={locale} />}
      {activeTab === "automation" && <AutomationSettings locale={locale} />}
    </div>
  );
}

// ============================================================
// Data Fetching Helpers
// ============================================================

async function fetchPolls(): Promise<Poll[]> {
  const response = await fetch("/api/admin/polls", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load polls");
  const data = (await response.json()) as { ok: boolean; polls: Poll[] };
  return data.ok ? data.polls : [];
}

export async function fetchPollRequests(): Promise<PollRequest[]> {
  const response = await fetch("/api/admin/poll-requests", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load poll requests");
  const data = (await response.json()) as { ok: boolean; pollRequests: PollRequest[] };
  return data.ok ? data.pollRequests : [];
}

async function fetchOverview(): Promise<{ polls?: number; pollRequests?: number; published?: number; pending?: number; scheduled?: number; drafts?: number; rejected?: number; totalVotes?: number }> {
  const response = await fetch("/api/admin/overview", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load overview");
  return response.json();
}

export async function moderatePollRequest(id: string, action: "approve" | "reject", locale: "hi" | "en"): Promise<void> {
  const method = action === "approve" ? "PUT" : "DELETE";
  const response = await fetch("/api/admin/poll-requests/" + id, {
    method,
    headers: { "content-type": "application/json" },
  });
  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !result.ok) {
    logAuditAction({
      action: action === "approve" ? "poll_request_approved" : "poll_request_rejected",
      actor: "admin",
      pollRequestId: id,
      details: result.error || "",
    });
    Alert({
      title: locale === "hi" ? "त्रुटि" : "Error",
      tone: "danger",
      children: result.error ?? locale === "hi" ? "क्रिया पूरी नहीं हुई।" : "Action could not be completed.",
    });
  } else {
    logAuditAction({
      action: action === "approve" ? "poll_request_approved" : "poll_request_rejected",
      actor: "admin",
      pollRequestId: id,
      details: `Poll request ${action}ed: ${action === "approve" ? "approved" : "rejected"}`,
    });
    Alert({
      title: locale === "hi" ? "सफलता" : "Success",
      tone: "success",
      children: locale === "hi" ? "क्रिया पूरी हुई।" : "Action completed.",
    });
  }
}

// ============================================================
// 1. All Polls Table
// ============================================================

function AllPollsTable({ locale }: { locale: "hi" | "en" }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [requests, setRequests] = useState<PollRequest[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [polls, requests] = await Promise.all([fetchPolls(), fetchPollRequests()]);
    setPolls(polls);
    setRequests(requests);
  }

  const allItems = useMemo(() => {
    const pollsNormalized = polls.map((poll) => ({
      ...poll,
      source: "poll" as const,
      requestId: null,
      status: poll.status || "published",
      displayOptions: poll.options?.map((opt) => ({
        id: opt.id || opt.label?.hi || opt.label?.en || `opt_${Math.random().toString(36).slice(2, 8)}`,
        label: opt.label || { hi: "विकल्प", en: "Option" },
      })) || [],
    }));

    const requestsNormalized = requests.map((req) => ({
      ...req,
      source: "request" as const,
      requestId: req.id,
      question: { hi: req.questionHi, en: req.questionEn },
      description: { hi: req.purpose || "", en: req.purpose || "" },
      options: req.optionsHi?.map((opt, i) => ({
        id: `req_opt_${i}`,
        label: { hi: opt, en: opt },
      })) || [],
    }));

    return [...pollsNormalized, ...requestsNormalized];
  }, [polls, requests]);

  const visible = allItems.filter(
    (item) =>
      item.source === "poll"
        ? item.status !== "draft" && item.status !== "archived"
        : item.status === "pending",
  );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-extrabold text-navy-900">
        {locale === "hi" ? "सभी पोल" : "All Polls"}
      </h2>
      <p className="text-[0.72rem] text-navy-500">
        Total: {allItems.length}{" "}
        {locale === "hi"
          ? "प्रकाशित: " + allItems.filter((i) => i.status === "published").length + "/"
          : "Published: " + allItems.filter((i) => i.status === "published").length + "/"}
        {locale === "hi"
          ? "लंबित: " + allItems.filter((i) => i.status === "pending").length
          : "Pending: " + allItems.filter((i) => i.status === "pending").length}
      </p>

      {visible.length === 0 ? (
        <p className="mt-3 text-[0.78rem] text-navy-500">
          {locale === "hi" ? "कोई पोल नहीं।" : "No polls yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((item) => {
            const isPoll = item.source === "poll";
            const status = isPoll ? (item.status || "published") : item.status;

            const firstOpt = isPoll
              ? item.displayOptions?.[0]?.label?.hi || item.displayOptions?.[0]?.label?.en || "—"
              : item.options?.[0]?.label?.hi || item.options?.[0]?.label?.en || "—";

            const displayClosesAt = isPoll ? item.closesAt : undefined;

            return (
              <li
                key={item.id}
                className="rounded-xl border border-navy-100 p-4 flex flex-col min-h-[200px]"
              >
                <div className="h-20 overflow-hidden rounded-md mb-3">
                  {item.options && item.options.length > 0 ? (
                    <div
                      className="h-full bg-navy-100 rounded-md flex items-center justify-center text-[0.66rem] text-navy-400"
                    >
                      {locale === "hi"
                        ? firstOpt
                        : firstOpt}
                    </div>
                  ) : (
                    <div className="h-20 bg-navy-100 rounded-md flex items-center justify-center text-[0.66rem] text-navy-400">
                      {locale === "hi" ? "विवरण" : "Details"}
                    </div>
                  )}
                </div>

                <h3 className="hindi text-[0.88rem] font-bold text-navy-900 line-clamp-2">
                  {item.source === "poll"
                    ? item.question?.hi
                    : item.questionHi}
                </h3>
                <p className="text-[0.66rem] text-navy-400 mt-1 line-clamp-1">
                  {item.source === "poll"
                    ? item.description?.hi
                    : item.questionEn || item.purpose || "—"}
                </p>

                <div className="mt-2 flex justify-between text-[0.62rem] text-navy-500">
                  <span>
                    {displayClosesAt ? new Date(displayClosesAt).toLocaleDateString() : "—"}
                  </span>
                  <Badge tone={
                    status === "published"
                      ? "teal"
                      : status === "pending"
                        ? "gold"
                        : status === "rejected"
                          ? "danger"
                          : status === "archived"
                            ? "navy"
                            : "teal"
                  }>
                    {locale === "hi"
                      ? getStatusHindi(status)
                      : getStatusEnglish(status)}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function getStatusHindi(status: string): string {
  const map: Record<string, string> = {
    published: "प्रकाशित",
    pending: "लंबित",
    rejected: "अस्वीकृत",
    closed: "बंद",
    archived: "आर्काइव",
    scheduled: "निर्धारित",
    draft: "ड्राफ्ट",
  };
  return map[status] || status;
}

function getStatusEnglish(status: string): string {
  const map: Record<string, string> = {
    published: "Published",
    pending: "Pending",
    rejected: "Rejected",
    closed: "Closed",
    archived: "Archived",
    scheduled: "Scheduled",
    draft: "Draft",
  };
  return map[status] || status;
}

// ============================================================
// 2. Add Poll Form
// ============================================================

function AddPollForm({ locale }: { locale: "hi" | "en" }) {
  const [formData, setFormData] = useState({
    questionHi: "",
    questionEn: "",
    descriptionHi: "",
    descriptionEn: "",
    category: "civic" as "civic" | "awareness" | "services" | "local",
    language: "hi" as "hi" | "en",
    optionsHi: ["", "", "", "", "", ""] as string[],
    optionsEn: ["", "", "", "", "", ""] as string[],
    startDate: "",
    endDate: "",
    featured: false,
    sponsored: false,
    sponsorLabelHi: "",
    sponsorLabelEn: "",
    seoTitleHi: "",
    seoTitleEn: "",
    seoDescriptionHi: "",
    seoDescriptionEn: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const [formErrors, setFormErrors] = useState<{ nonValid?: boolean; errors: string[] }>({ errors: [] });

  function getErrorMessage(key: string): string {
    const hiErrors: { [key: string]: string } = {
      questionHiShort: "प्रश्न (हिंदी) कम से कम 10 अक्षरों का होना चाहिए",
      questionEnShort: "प्रश्न (अंग्रेज़ी) कम से कम 10 अक्षरों का होना चाहिए",
      optionsHiFew: "कम से कम 2 विकल्प (हिंदी) भरें",
      optionsEnFew: "कम से कम 2 विकल्प (अंग्रेज़ी) भरें",
      startDatePast: "शुरू होने की तारीख भविष्य की तारीख होनी चाहिए",
      endDateBeforeStart: "समाप्ति तारीख, शुरू होने की तारीख से बाद की होनी चाहिए",
    };
    const enErrors: { [key: string]: string } = {
      questionHiShort: "Hindi question must be at least 10 characters",
      questionEnShort: "English question must be at least 10 characters",
      optionsHiFew: "At least 2 Hindi options must be filled",
      optionsEnFew: "At least 2 English options must be filled",
      startDatePast: "Start date must be a future date",
      endDateBeforeStart: "End date must be after start date",
    };
    return locale === "hi" ? hiErrors[key] || "" : enErrors[key] || "";
  }

  function validateForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (formData.questionHi.length < 10) {
      errors.push(getErrorMessage("questionHiShort"));
    }
    if (formData.questionEn.length < 10) {
      errors.push(getErrorMessage("questionEnShort"));
    }
    const activeOptionsHi = formData.optionsHi.filter((o) => o.length > 0);
    const activeOptionsEn = formData.optionsEn.filter((o) => o.length > 0);
    if (activeOptionsHi.length < 2) {
      errors.push(getErrorMessage("optionsHiFew"));
    }
    if (activeOptionsEn.length < 2) {
      errors.push(getErrorMessage("optionsEnFew"));
    }
    if (new Date(formData.startDate) <= new Date()) {
      errors.push(getErrorMessage("startDatePast"));
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.push(getErrorMessage("endDateBeforeStart"));
    }

    return { valid: errors.length === 0, errors };
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.valid) {
      setFormErrors({
        nonValid: true,
        errors: validation.errors,
      });
      return;
    }
    setIsSaving(true);

    const pollData = {
      question: { hi: formData.questionHi, en: formData.questionEn },
      description: { hi: formData.descriptionHi, en: formData.descriptionEn },
      category: formData.category,
      closesAt: formData.endDate,
      status: "draft",
      featured: formData.featured,
      sponsored: formData.sponsored,
      isDemo: false,
      createdAt: new Date().toISOString(),
      options: formData.optionsHi.map((hi, i) => ({
        hi: hi || `विकल्प ${i + 1}`,
        en: formData.optionsEn[i] || `Option ${i + 1}`,
      })),
    };

    try {
      const response = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pollData),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      setIsSaving(false);
      if (!response.ok || !result.ok) {
        Alert({
          title: locale === "hi" ? "त्रुटि" : "Error",
          tone: "danger",
          children: result.error ?? locale === "hi" ? "सहेजा नहीं गया।" : "Could not save.",
        });
      } else {
        Alert({
          title: locale === "hi" ? "सफलता" : "Success",
          tone: "success",
          children: locale === "hi" ? "पोल सहेजा गयाDraft के रूप में।" : "Poll saved as Draft.",
        });
        setFormData({
          questionHi: "",
          questionEn: "",
          descriptionHi: "",
          descriptionEn: "",
          category: "civic",
          language: "hi",
          optionsHi: ["", ""],
          optionsEn: ["", ""],
          startDate: "",
          endDate: "",
          featured: false,
          sponsored: false,
          sponsorLabelHi: "",
          sponsorLabelEn: "",
          seoTitleHi: "",
          seoTitleEn: "",
          seoDescriptionHi: "",
          seoDescriptionEn: "",
        });
        setFormErrors({ errors: [] });
        window.dispatchEvent(new CustomEvent("poll-created"));
      }
    } catch (err) {
      setIsSaving(false);
      Alert({
        title: locale === "hi" ? "त्रुटि" : "Error",
        tone: "danger",
        children: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-extrabold text-navy-900">
        {locale === "hi" ? "पोल जोड़ें" : "Add Poll"}
      </h2>

      <form onSubmit={onSubmit} className="rounded-2xl border border-navy-100 bg-white p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <TextField
            label={locale === "hi" ? "प्रश्न (हिंदी)" : "Question (Hindi)"}
            value={formData.questionHi}
            onChange={(e) => setFormData({ ...formData, questionHi: e.target.value })}
            minLength={10}
            maxLength={200}
            placeholder={locale === "hi" ? "पोल का प्रश्न दर्ज करें" : "Enter poll question"}
          />
          {formErrors.nonValid && formErrors.errors.includes("questionHiShort") && <p className="text-[0.66rem] text-red-500 mt-1">{getErrorMessage("questionHiShort")}</p>}
          <TextField
            label={locale === "hi" ? "प्रश्न (अंग्रेज़ी)" : "Question (English)"}
            value={formData.questionEn}
            onChange={(e) => setFormData({ ...formData, questionEn: e.target.value })}
            minLength={10}
            maxLength={200}
            placeholder={locale === "hi" ? "Enter poll question in English" : "Enter poll question in English"}
          />
          {formErrors.nonValid && formErrors.errors.includes("questionEnShort") && <p className="text-[0.66rem] text-red-500 mt-1">{getErrorMessage("questionEnShort")}</p>}
        </div>

        <TextAreaField
          label={locale === "hi" ? "विवरण (हिंदी)" : "Description (Hindi)"}
          value={formData.descriptionHi}
          onChange={(e) => setFormData({ ...formData, descriptionHi: e.target.value })}
          maxLength={600}
          placeholder={locale === "hi" ? "पोल का विवरण" : "Poll description"}
        />

        <TextAreaField
          label={locale === "hi" ? "विवरण (अंग्रेज़ी)" : "Description (English)"}
          value={formData.descriptionEn}
          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
          maxLength={600}
          placeholder={locale === "hi" ? "Enter description in English" : "Enter description in English"}
        />

        <div className="grid grid-cols-2 gap-2 mb-4">
          <SelectField
            label={locale === "hi" ? "श्रेणी" : "Category"}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: (e.target as HTMLSelectElement).value as "civic" | "awareness" | "services" | "local" })}
          >
            <option value="civic">{locale === "hi" ? "नागरिक मुद्दे" : "Civic issues"}</option>
            <option value="awareness">{locale === "hi" ? "जागरूकता" : "Awareness"}</option>
            <option value="services">{locale === "hi" ? "सेवाएँ" : "Services"}</option>
            <option value="local">{locale === "hi" ? "स्थानीय" : "Local"}</option>
          </SelectField>

          <SelectField
            label={locale === "hi" ? "भाषा" : "Language"}
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: (e.target as HTMLSelectElement).value as "hi" | "en" })}
          >
            <option value="hi">{locale === "hi" ? "हिंदी" : "Hindi"}</option>
            <option value="en">{locale === "hi" ? "English" : "English"}</option>
          </SelectField>
        </div>

        <div className="grid grid-cols-2 grid-cols-sm-2 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <TextField
                label={locale === "hi" ? `विकल्प ${i} (हिंदी)` : `Option ${i} (Hindi)`}
                value={formData.optionsHi[i - 1] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionsHi: formData.optionsHi.map((_, idx) => (idx + 1 === i ? e.target.value : formData.optionsHi[idx])),
                  })
                }
                minLength={1}
                maxLength={90}
              />
              <TextField
                label={locale === "hi" ? `विकल्प ${i} (अंग्रेज़ी)` : `Option ${i} (English)`}
                value={formData.optionsEn[i - 1] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionsEn: formData.optionsEn.map((_, idx) => (idx + 1 === i ? e.target.value : formData.optionsEn[idx])),
                  })
                }
                minLength={1}
                maxLength={90}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <TextField
            label={locale === "hi" ? "शुरू होने की तारीख" : "Start Date"}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            type="date"
            error={
              formErrors.nonValid && formErrors.errors.includes("startDatePast")
                ? getErrorMessage("startDatePast")
                : undefined
            }
          />
          <TextField
            label={locale === "hi" ? "समाप्ति तारीख" : "End Date"}
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            type="date"
            error={
              formErrors.nonValid && formErrors.errors.includes("endDateBeforeStart")
                ? getErrorMessage("endDateBeforeStart")
                : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <SelectField
            label={locale === "hi" ? "प्रमुख" : "Featured"}
            value={formData.featured.toString()}
            onChange={(e) => setFormData({ ...formData, featured: e.target.value === "true" })}
          >
            <option value="false">{locale === "hi" ? "नहीं" : "No"}</option>
            <option value="true">{locale === "hi" ? "नहीं" : "Yes"}</option>
          </SelectField>

          <SelectField
            label={locale === "hi" ? "प्रायोजित" : "Sponsored"}
            value={formData.sponsored.toString()}
            onChange={(e) => setFormData({ ...formData, sponsored: e.target.value === "true" })}
          >
            <option value="false">{locale === "hi" ? "नहीं" : "No"}</option>
            <option value="true">{locale === "hi" ? "नहीं" : "Yes"}</option>
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <TextField
            label={locale === "hi" ? "प्रायोजक का नाम (हिंदी)" : "Sponsor Label (Hindi)"}
            value={formData.sponsorLabelHi}
            onChange={(e) => setFormData({ ...formData, sponsorLabelHi: e.target.value })}
            maxLength={80}
          />
          <TextField
            label={locale === "hi" ? "प्रायोजक का नाम (अंग्रेज़ी)" : "Sponsor Label (English)"}
            value={formData.sponsorLabelEn}
            onChange={(e) => setFormData({ ...formData, sponsorLabelEn: e.target.value })}
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextField
            label={locale === "hi" ? "SEO शीर्षक (हिंदी)" : "SEO Title (Hindi)"}
            value={formData.seoTitleHi}
            onChange={(e) => setFormData({ ...formData, seoTitleHi: e.target.value })}
            maxLength={160}
          />
          <TextField
            label={locale === "hi" ? "SEO शीर्षक (अंग्रेज़ी)" : "SEO Title (English)"}
            value={formData.seoTitleEn}
            onChange={(e) => setFormData({ ...formData, seoTitleEn: e.target.value })}
            maxLength={160}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TextField
            label={locale === "hi" ? "SEO विवरण (हिंदी)" : "SEO Description (Hindi)"}
            value={formData.seoDescriptionHi}
            onChange={(e) => setFormData({ ...formData, seoDescriptionHi: e.target.value })}
            maxLength={300}
          />
          <TextField
            label={locale === "hi" ? "SEO विवरण (अंग्रेज़ी)" : "SEO Description (English)"}
            value={formData.seoDescriptionEn}
            onChange={(e) => setFormData({ ...formData, seoDescriptionEn: e.target.value })}
            maxLength={300}
          />
        </div>

        <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl border border-navy-600 bg-navy-600 text-white font-semibold text-sm">
          {isSaving ? "…" : locale === "hi" ? "सहेजें" : "Save"}
        </button>
      </form>
    </div>
  );
}