"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { pick } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { buttonClass } from "@/components/ui";
import { IconExternal } from "@/components/icons";
import { useAuth } from "@/components/auth-hook";

type DailyResponse = {
  ok?: boolean;
  date?: string;
  quizSlug?: string;
  question?: { id: string; prompt: { hi: string; en: string }; options: { hi: string; en: string }[] };
  totalQuestions?: number;
  source?: string;
};

type AnswerResponse = {
  ok?: boolean;
  correct?: boolean;
  correctIndex?: number;
  explanation?: { hi: string; en: string };
  sources?: { label: string; url: string }[];
};

export function DailyQuizCard() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const [question, setQuestion] = useState<DailyResponse | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/quiz/daily", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: DailyResponse) => {
        if (!active) return;
        setQuestion(data);
        setError(!data.ok);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function answer(optionIndex: number) {
    if (!question || !question.question || selected !== null) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/quiz/daily", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.question.id, optionIndex }),
      });
      const data = (await response.json()) as AnswerResponse;
      setResult(data);
      setSelected(optionIndex);
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  if (error || !question?.ok || !question.question) {
    return (
      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <p className="text-sm text-navy-600">{t.common.error}</p>
      </div>
    );
  }

  const prompt = pick(question.question.prompt, locale);

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="brand">{locale === "hi" ? "आज का सवाल" : "Today's question"}</Badge>
        <span className="text-[0.66rem] font-medium text-navy-400">{question.date}</span>
      </div>
      <h3 className="hindi mt-3 text-lg font-extrabold text-navy-900">{prompt}</h3>
      <div className="mt-3 space-y-2" role="group" aria-label={locale === "hi" ? "विकल्प" : "Options"}>
        {question.question.options.map((option, index) => {
          const isPicked = selected === index;
          const showCorrect = Boolean(result?.correct);
          const isCorrectOption = showCorrect && index === result?.correctIndex;
          const showWrong = Boolean(result && isPicked && !result.correct);
          return (
            <button
              key={index}
              type="button"
              onClick={() => void answer(index)}
              disabled={Boolean(result)}
              aria-pressed={isPicked}
              className={
                isCorrectOption
                  ? "flex w-full items-center gap-2.5 rounded-xl border border-teal-400 bg-teal-50 px-3.5 py-3 text-left text-[0.86rem] font-semibold text-teal-900"
                  : showWrong
                    ? "flex w-full items-center gap-2.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-left text-[0.86rem] font-semibold text-red-900"
                    : "flex w-full items-center gap-2.5 rounded-xl border border-navy-200 bg-white px-3.5 py-3 text-left text-[0.86rem] font-semibold text-navy-700 hover:border-navy-300"
              }
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-white text-[0.65rem] font-bold border-navy-300 text-navy-500">
                {String.fromCharCode(65 + index)}
              </span>
              {pick(option, locale)}
            </button>
          );
        })}
      </div>

      {result ? (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-[0.8rem] text-teal-900">
          <p className="font-extrabold">{result.correct ? (locale === "hi" ? "सही!" : "Correct!") : locale === "hi" ? "गलत" : "Not quite"}</p>
          {result.explanation ? <p className="mt-1 leading-relaxed">{pick(result.explanation, locale)}</p> : null}
          {result.sources?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {result.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-brand-700 underline-offset-2 hover:underline">
                  {source.label} <IconExternal className="h-3 w-3" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!result ? (
        <button type="button" disabled={busy || !user} onClick={() => void answer(selected!)} className={buttonClass("secondary", "md", "mt-3")}>
          {busy ? t.common.sending : locale === "hi" ? "स्कोर सहेजें" : "Save score"}
        </button>
      ) : null}
    </div>
  );
}
