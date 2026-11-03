"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { pick } from "@/lib/i18n";
import { quizPercent, scoreQuiz } from "@/lib/quiz";
import { Badge, ButtonLink, buttonClass, cn } from "@/components/ui";
import { IconArrowLeft, IconCheck, IconClose, IconExternal, quizIcons } from "@/components/icons";
import { useAuth } from "@/components/auth-hook";
import type { Quiz } from "@/lib/types";

const tones: Record<string, { chip: string; ring: string; icon: string }> = {
  saffron: { chip: "bg-brand-50 text-brand-800", ring: "border-brand-200", icon: "bg-brand-100 text-brand-700" },
  navy: { chip: "bg-navy-50 text-navy-800", ring: "border-navy-200", icon: "bg-navy-100 text-navy-700" },
  teal: { chip: "bg-teal-50 text-teal-700", ring: "border-teal-200", icon: "bg-teal-100 text-teal-700" },
  gold: { chip: "bg-gold-100 text-amber-900", ring: "border-amber-200", icon: "bg-gold-100 text-amber-800" },
};

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.questions.map(() => null));
  const [finished, setFinished] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    if (!finished || !user) return;
    let active = true;
    void (async () => {
      const response = await fetch("/api/games/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quizSlug: quiz.slug, answers: answers.filter((value): value is number => value !== null) }),
      });
      const data = (await response.json()) as { ok?: boolean; best?: number };
      if (active && response.ok) setBestScore(data.best ?? null);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, user]);

  const question = quiz.questions[index]!;
  const answeredCurrent = selected !== null;
  const isCorrect = selected === question.correctIndex;
  const score = useMemo(() => scoreQuiz(quiz, answers), [answers, quiz]);
  const percent = quizPercent(score, quiz.questions.length);
  const tone = tones[quiz.color] ?? tones.saffron!;
  const Icon = quizIcons[quiz.icon as keyof typeof quizIcons] ?? quizIcons.book;

  function choose(optionIndex: number) {
    if (answeredCurrent) return;
    setSelected(optionIndex);
    setAnswers((current) => {
      const next = [...current];
      next[index] = optionIndex;
      return next;
    });
  }

  function next() {
    if (index + 1 >= quiz.questions.length) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setAnswers(quiz.questions.map(() => null));
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="container-page max-w-3xl py-10">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-card sm:p-8">
          <span className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-2xl", tone.icon)}>
            <Icon className="h-7 w-7" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            {locale === "hi" ? "आपका स्कोर" : "Your score"}
          </p>
          <p className="hindi mt-1 text-4xl font-extrabold text-navy-900">
            {score} <span className="text-xl text-navy-400">/ {quiz.questions.length}</span>
          </p>
          {bestScore !== null ? (
            <p className="mt-2 text-[0.72rem] font-bold text-teal-700">
              {locale === "hi" ? "आपका बेस्ट स्कोर: " : "Your best score: "} {bestScore}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-navy-600">
            {percent >= 80
              ? locale === "hi" ? "बहुत बढ़िया!" : "Excellent!"
              : percent >= 50
                ? locale === "hi" ? "अच्छी समझ — कुछ जवाब दोबारा देखें।" : "Good understanding — review a few answers."
                : locale === "hi" ? "कोई बात नहीं, दोबारा सीखें।" : "No problem — learn and try again."}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={restart} className={buttonClass("primary", "md")}>
              {locale === "hi" ? "फिर खेलें" : "Play again"}
            </button>
            <ButtonLink href="/games" variant="outline" size="md">
              {locale === "hi" ? "सभी खेल" : "All games"}
            </ButtonLink>
          </div>
          <p className="mt-4 text-[0.68rem] text-navy-400">
            {locale === "hi" ? "स्कोर केवल सीखने के लिए है, किसी जनमत या चुनाव परिणाम का संकेत नहीं।" : "Scores are for learning only and are not a poll or election signal."}
          </p>
        </div>

        <h2 className="mt-8 text-base font-extrabold text-navy-900">{locale === "hi" ? "जवाब दोबारा देखें" : "Review answers"}</h2>
        <ol className="mt-3 space-y-3">
          {quiz.questions.map((item, position) => {
            const answer = answers[position];
            const correct = answer === item.correctIndex;
            return (
              <li key={item.id} className="rounded-xl border border-navy-100 bg-white p-4">
                <div className="flex items-start gap-2">
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white", correct ? "bg-teal-500" : "bg-red-500")}>
                    {correct ? <IconCheck className="h-3 w-3" /> : <IconClose className="h-3 w-3" />}
                  </span>
                  <div>
                    <p className="hindi text-[0.9rem] font-bold text-navy-900">{pick(item.prompt, locale)}</p>
                    <p className="mt-1 text-[0.76rem] text-navy-600">
                      {locale === "hi" ? "सही जवाब:" : "Correct answer:"}{" "}
                      <strong>{pick(item.options[item.correctIndex]!, locale)}</strong>
                    </p>
                    <p className="mt-1 text-[0.76rem] leading-relaxed text-navy-500">{pick(item.explanation, locale)}</p>
                    {item.sources?.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {item.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-brand-700 underline-offset-2 hover:underline"
                          >
                            {source.label} <IconExternal className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/games" className="inline-flex items-center gap-1 text-xs font-bold text-navy-600 hover:text-brand-700">
          <IconArrowLeft className="h-4 w-4" /> {locale === "hi" ? "सभी खेल" : "All games"}
        </Link>
        <span className="text-[0.72rem] font-bold text-navy-500">
          {locale === "hi" ? "सवाल" : "Question"} {index + 1} / {quiz.questions.length}
        </span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-navy-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone.icon)}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="hindi text-sm font-extrabold text-navy-900">{pick(quiz.title, locale)}</p>
            <p className="text-[0.68rem] text-navy-500">{quiz.questions.length} {locale === "hi" ? "सवाल" : "questions"}</p>
          </div>
        </div>

        <h1 className="hindi mt-4 text-balance text-xl font-extrabold leading-snug text-navy-900 sm:text-2xl">
          {pick(question.prompt, locale)}
        </h1>

        <div className="mt-4 space-y-2" role="group" aria-label={locale === "hi" ? "विकल्प" : "Options"}>
          {question.options.map((option, optionIndex) => {
            const isPicked = selected === optionIndex;
            const showCorrect = answeredCurrent && optionIndex === question.correctIndex;
            const showWrong = answeredCurrent && isPicked && optionIndex !== question.correctIndex;
            return (
              <button
                key={`${question.id}-${optionIndex}`}
                type="button"
                onClick={() => choose(optionIndex)}
                disabled={answeredCurrent}
                aria-pressed={isPicked}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[0.86rem] font-semibold transition",
                  showCorrect
                    ? "border-teal-400 bg-teal-50 text-teal-900"
                    : showWrong
                      ? "border-red-300 bg-red-50 text-red-900"
                      : isPicked
                        ? "border-brand-400 bg-brand-50 text-brand-900"
                        : "border-navy-200 bg-white text-navy-700 hover:border-navy-300",
                )}
              >
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-bold", showCorrect ? "border-teal-500 bg-teal-500 text-white" : showWrong ? "border-red-500 bg-red-500 text-white" : "border-navy-300 text-navy-500")}>
                  {showCorrect ? <IconCheck className="h-3 w-3" /> : showWrong ? <IconClose className="h-3 w-3" /> : String.fromCharCode(65 + optionIndex)}
                </span>
                {pick(option, locale)}
              </button>
            );
          })}
        </div>

        {answeredCurrent ? (
          <div
            className={cn(
              "mt-4 rounded-xl border px-4 py-3",
              isCorrect ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50",
            )}
            role="status"
          >
            <p className={cn("text-sm font-extrabold", isCorrect ? "text-teal-900" : "text-amber-950")}>
              {isCorrect ? (locale === "hi" ? "सही!" : "Correct!") : locale === "hi" ? "गलत — सही जवाब देखें" : "Not quite — see the correct answer"}
            </p>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-navy-700">{pick(question.explanation, locale)}</p>
            {question.sources?.length ? (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {question.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-brand-700 underline-offset-2 hover:underline"
                  >
                    {source.label} <IconExternal className="h-3 w-3" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-2">
          <Badge tone="outline">{score} {locale === "hi" ? "सही" : "correct"}</Badge>
          <button
            type="button"
            onClick={next}
            disabled={!answeredCurrent}
            className={buttonClass("primary", "md", "ml-auto")}
          >
            {index + 1 >= quiz.questions.length
              ? locale === "hi" ? "नतीजा देखें" : "See result"
              : locale === "hi" ? "अगला सवाल" : "Next question"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-[0.68rem] text-navy-400">
        {locale === "hi" ? "स्कोर केवल सीखने के लिए है और किसी जनमत या चुनाव परिणाम का संकेत नहीं।" : "Scores are for learning only and are not a poll or election signal."}
      </p>
    </div>
  );
}
