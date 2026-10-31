"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { FormStatus, LocationFields, SelectField, TextAreaField, TextField } from "@/components/form-controls";
import { Badge, DemoBadge, EmptyState, buttonClass, cn } from "@/components/ui";
import { IconChat, IconClock } from "@/components/icons";
import { categoryLabel, discussionCategoryLabels, relativeTime } from "@/lib/labels";
import { discussionCategories } from "@/lib/validation";
import type { Thread } from "@/lib/types";

export function DiscussionsExplorer({ initialThreads }: { initialThreads: Thread[] }) {
  const { locale } = useLocale();
  const { location, hydrated } = useLocation();
  const [threads, setThreads] = useState(initialThreads);
  const [scope, setScope] = useState<"all" | "local">("all");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [alias, setAlias] = useState("");
  const [category, setCategory] = useState<(typeof discussionCategories)[number]>("civic");
  const [stateId, setStateId] = useState(hydrated ? location.stateId : "up");
  const [districtId, setDistrictId] = useState(hydrated ? location.districtId : "up-lucknow");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      threads.filter((thread) => {
        if (filter !== "all" && thread.category !== filter) return false;
        if (scope === "local" && thread.districtId !== location.districtId) return false;
        return true;
      }),
    [threads, filter, scope, location.districtId],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, authorAlias: alias, category, districtId, stateId }),
      });
      const data = (await response.json()) as { ok?: boolean; thread?: Thread; error?: string };
      if (!response.ok || !data.ok || !data.thread) {
        setError(data.error ?? (locale === "hi" ? "चर्चा शुरू नहीं हो सकी।" : "Could not start the discussion."));
        setState("error");
        return;
      }
      setThreads((current) => [data.thread as Thread, ...current]);
      setTitle("");
      setBody("");
      setAlias("");
      setState("success");
      setFormOpen(false);
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setState("error");
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-navy-200 bg-white p-1">
          {(["all", "local"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScope(item)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold",
                scope === item ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50",
              )}
              aria-pressed={scope === item}
            >
              {item === "all" ? (locale === "hi" ? "सभी" : "All") : locale === "hi" ? "मेरा ज़िला" : "My district"}
            </button>
          ))}
        </div>
        <select
          aria-label={locale === "hi" ? "श्रेणी" : "Category"}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700"
        >
          <option value="all">{locale === "hi" ? "सभी श्रेणियाँ" : "All categories"}</option>
          {discussionCategories.map((item) => (
            <option key={item} value={item}>
              {discussionCategoryLabels[item]?.[locale] ?? item}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className={buttonClass("primary", "sm", "ml-auto")}>
          <IconChat className="h-4 w-4" />
          {formOpen ? (locale === "hi" ? "फ़ॉर्म बंद करें" : "Close form") : locale === "hi" ? "नई चर्चा" : "New discussion"}
        </button>
      </div>

      {state === "success" ? (
        <FormStatus tone="success">{locale === "hi" ? "चर्चा शुरू हो गई।" : "Discussion started."}</FormStatus>
      ) : null}

      {formOpen ? (
        <form onSubmit={submit} className="mb-6 rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
          <h2 className="hindi mb-3 text-base font-extrabold text-navy-900">{locale === "hi" ? "नई चर्चा शुरू करें" : "Start a discussion"}</h2>
          <div className="grid gap-3">
            <TextField
              label={locale === "hi" ? "चर्चा का विषय" : "Discussion title"}
              required
              minLength={8}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={locale === "hi" ? "जैसे: वार्ड में कचरा अलग करने की व्यवस्था कैसे शुरू हो?" : "e.g. How can our ward start segregated waste collection?"}
            />
            <TextAreaField
              label={locale === "hi" ? "अपनी बात लिखें" : "Your message"}
              required
              minLength={20}
              maxLength={2000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={locale === "hi" ? "अपना अनुभव, सवाल या सुझाव साझा करें। अफ़वाह या व्यक्तिगत हमला न करें।" : "Share your experience, question or suggestion. No rumours or personal attacks."}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={locale === "hi" ? "आपका उपनाम" : "Your alias"}
                hint={locale === "hi" ? "असली नाम ज़रूरी नहीं" : "real name not required"}
                required
                minLength={2}
                maxLength={30}
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                placeholder={locale === "hi" ? "जैसे: जागरूक नागरिक" : "e.g. Aware Citizen"}
              />
              <SelectField
                label={locale === "hi" ? "श्रेणी" : "Category"}
                value={category}
                onChange={(event) => setCategory(event.target.value as typeof category)}
              >
                {discussionCategories.map((item) => (
                  <option key={item} value={item}>
                    {discussionCategoryLabels[item]?.[locale] ?? item}
                  </option>
                ))}
              </SelectField>
            </div>
            <LocationFields
              stateId={stateId}
              districtId={districtId}
              onStateChange={(nextState, nextDistrict) => {
                setStateId(nextState);
                setDistrictId(nextDistrict);
              }}
              onDistrictChange={setDistrictId}
            />
            {error ? <FormStatus tone="error">{error}</FormStatus> : null}
            <p className="text-[0.7rem] leading-relaxed text-navy-500">
              {locale === "hi"
                ? "सभ्य भाषा रखें। किसी व्यक्ति को निशाना न बनाएँ, धमकी या सांप्रदायिक बात न लिखें। निजी जानकारी सार्वजनिक न करें।"
                : "Keep it civil. No targeting individuals, threats or communal language. Do not post private data."}
            </p>
            <button type="submit" disabled={state === "sending"} className={buttonClass("primary", "md", "justify-self-start")}>
              {state === "sending" ? (locale === "hi" ? "भेज रहे हैं…" : "Sending…") : locale === "hi" ? "चर्चा शुरू करें" : "Post discussion"}
            </button>
          </div>
        </form>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={<IconChat className="h-7 w-7" />}
          title={locale === "hi" ? "यहाँ अभी कोई चर्चा नहीं" : "No discussions yet"}
          description={locale === "hi" ? "पहली बात आप शुरू करें।" : "Be the first to start a conversation."}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/discussions/${thread.id}`}
                className="group block rounded-2xl border border-navy-100 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-float sm:p-5"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="outline">{categoryLabel(discussionCategoryLabels, thread.category, locale)}</Badge>
                  {thread.isDemo ? <DemoBadge /> : null}
                  <span className="ml-auto inline-flex items-center gap-1 text-[0.68rem] text-navy-400">
                    <IconClock className="h-3.5 w-3.5" /> {relativeTime(thread.createdAt, locale)}
                  </span>
                </div>
                <h2 className="hindi text-[1.02rem] font-extrabold leading-snug text-navy-900 group-hover:text-brand-800">
                  {thread.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-relaxed text-navy-600">{thread.body}</p>
                <p className="mt-3 flex items-center gap-2 text-[0.7rem] text-navy-500">
                  <span className="font-semibold text-navy-700">{thread.authorAlias}</span>
                  <span aria-hidden>·</span>
                  <span>{thread.replyCount} {locale === "hi" ? "जवाब" : "replies"}</span>
                  <span className="ml-auto font-bold text-brand-700">{locale === "hi" ? "पढ़ें →" : "Read →"}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
