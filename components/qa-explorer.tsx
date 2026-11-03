"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { FormStatus, LocationFields, TextAreaField } from "@/components/form-controls";
import { Badge, ButtonLink, DemoBadge, EmptyState, buttonClass, cn } from "@/components/ui";
import { IconExternal, IconQa } from "@/components/icons";
import { formatDate } from "@/lib/labels";
import type { Question } from "@/lib/types";

export function QaExplorer({ initialQuestions }: { initialQuestions: Question[] }) {
  const { locale } = useLocale();
  const { location, hydrated } = useLocation();
  const [questions, setQuestions] = useState(initialQuestions);
  const [scope, setScope] = useState<"all" | "local">("all");
  const [filter, setFilter] = useState<"all" | "answered" | "pending">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [stateId, setStateId] = useState(hydrated ? location.stateId : "up");
  const [districtId, setDistrictId] = useState(hydrated ? location.districtId : "up-lucknow");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      questions.filter((item) => {
        if (filter === "answered" && !item.answer) return false;
        if (filter === "pending" && item.answer) return false;
        if (scope === "local" && item.districtId && item.districtId !== location.districtId) return false;
        return true;
      }),
    [questions, filter, scope, location.districtId],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, stateId, districtId }),
      });
      const data = (await response.json()) as { ok?: boolean; question?: Question; error?: string };
      if (!response.ok || !data.ok || !data.question) {
        setError(data.error ?? (locale === "hi" ? "सवाल भेजा नहीं जा सका।" : "Could not submit the question."));
        setState("error");
        return;
      }
      setQuestions((current) => [data.question as Question, ...current]);
      setQuestion("");
      setState("success");
      setFormOpen(false);
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setState("error");
    }
  }

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
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
            aria-label={locale === "hi" ? "जवाब की स्थिति" : "Answer status"}
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700"
          >
            <option value="all">{locale === "hi" ? "सभी" : "All"}</option>
            <option value="answered">{locale === "hi" ? "जवाब मिले" : "Answered"}</option>
            <option value="pending">{locale === "hi" ? "प्रतीक्षारत" : "Pending"}</option>
          </select>
          <button type="button" onClick={() => setFormOpen((open) => !open)} className={buttonClass("primary", "sm", "ml-auto")}>
            <IconQa className="h-4 w-4" />
            {formOpen ? (locale === "hi" ? "फ़ॉर्म बंद करें" : "Close form") : locale === "hi" ? "सवाल पूछें" : "Ask a question"}
          </button>
        </div>

        {state === "success" ? (
          <FormStatus tone="success">
            {locale === "hi" ? "सवाल दर्ज हो गया। जवाब समीक्षा के बाद जोड़ा जाएगा।" : "Question submitted. An answer will be added after review."}
          </FormStatus>
        ) : null}

        {formOpen ? (
          <form onSubmit={submit} className="mb-6 rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
            <h2 className="hindi mb-3 text-base font-extrabold text-navy-900">{locale === "hi" ? "नागरिक सवाल पूछें" : "Ask a civic question"}</h2>
            <div className="grid gap-3">
              <TextAreaField
                label={locale === "hi" ? "आपका सवाल" : "Your question"}
                hint={locale === "hi" ? "10–400 अक्षर" : "10–400 characters"}
                required
                minLength={10}
                maxLength={400}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={locale === "hi" ? "जैसे: पानी की शिकायत कहाँ दर्ज करें?" : "e.g. Where do I file a water complaint?"}
              />
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
                  ? "कृपया निजी जानकारी न लिखें। जवाब केवल आधिकारिक स्रोत मिलने पर ‘आधिकारिक’ के रूप में चिह्नित होंगे।"
                  : "Do not include private information. Answers are marked ‘official’ only when an official source is attached."}
              </p>
              <button type="submit" disabled={state === "sending"} className={buttonClass("primary", "md", "justify-self-start")}>
                {state === "sending" ? (locale === "hi" ? "भेज रहे हैं…" : "Sending…") : locale === "hi" ? "सवाल भेजें" : "Submit question"}
              </button>
            </div>
          </form>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            icon={<IconQa className="h-7 w-7" />}
            title={locale === "hi" ? "इस फ़िल्टर में कोई सवाल नहीं" : "No questions match this filter"}
            description={locale === "hi" ? "फ़िल्टर बदलें या पहला सवाल पूछें।" : "Change the filter or ask the first question."}
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => {
              const answered = Boolean(item.answer);
              return (
                <li key={item.id} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {answered ? (
                      <Badge tone={item.answerStatus === "official_source" ? "teal" : "neutral"}>
                        {item.answerStatus === "official_source"
                          ? locale === "hi" ? "आधिकारिक स्रोत से" : "From official source"
                          : locale === "hi" ? "सामुदायिक जवाब" : "Community answer"}
                      </Badge>
                    ) : (
                      <Badge tone="gold">{locale === "hi" ? "जवाब की प्रतीक्षा" : "Awaiting answer"}</Badge>
                    )}
                    {item.isDemo ? <DemoBadge /> : null}
                    <span className="ml-auto text-[0.66rem] text-navy-400">{formatDate(item.createdAt, locale)}</span>
                  </div>
                  <h2 className="hindi text-[1rem] font-extrabold leading-snug text-navy-900">{item.question}</h2>
                  {item.answer ? (
                    <p className="mt-2 whitespace-pre-line border-l-2 border-teal-200 pl-3 text-[0.84rem] leading-relaxed text-navy-700">
                      {item.answer}
                    </p>
                  ) : (
                    <p className="mt-2 text-[0.78rem] text-navy-500">
                      {locale === "hi"
                        ? "इस सवाल का जवाब अभी सत्यापित स्रोत से नहीं जोड़ा गया। कृपया आधिकारिक पोर्टल पर जाँचें।"
                        : "No verified-source answer has been added yet. Please check the official portal."}
                    </p>
                  )}
                  {item.sources.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                      {item.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-700 underline-offset-2 hover:underline"
                        >
                          {source.label} <IconExternal className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
          <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "जवाब कैसे जुड़ते हैं?" : "How answers work"}</h2>
          <ul className="mt-2 space-y-1.5 text-[0.72rem] leading-relaxed text-navy-600">
            <li>{locale === "hi" ? "‘आधिकारिक स्रोत’ का अर्थ है जवाब के साथ सरकारी/आधिकारिक लिंक जुड़ा है।" : "‘Official source’ means an official link is attached to the answer."}</li>
            <li>{locale === "hi" ? "बिना स्रोत वाले जवाब ‘सामुदायिक’ या ‘प्रतीक्षारत’ रहते हैं।" : "Answers without sources remain ‘community’ or ‘pending’."}</li>
            <li>{locale === "hi" ? "यह मंच कानूनी सलाह नहीं देता।" : "This platform does not give legal advice."}</li>
          </ul>
        </div>
        <ButtonLink href="/assistant" variant="outline" className="w-full">
          <IconQa className="h-4 w-4" />
          {locale === "hi" ? "Public Saathi से पूछें" : "Ask Public Saathi"}
        </ButtonLink>
      </aside>
    </div>
  );
}
