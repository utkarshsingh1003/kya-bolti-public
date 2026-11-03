"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { pick } from "@/lib/i18n";
import { formatDate } from "@/lib/labels";
import type { PollWithResults } from "@/lib/types";
import { Badge, DemoBadge, buttonClass, cn } from "@/components/ui";
import { IconCheck, IconPoll } from "@/components/icons";

type PollResponse = {
  ok?: boolean;
  counts?: Record<string, number>;
  totalVotes?: number;
  hasVoted?: boolean;
  error?: string;
  reason?: string;
};

export function PollCard({
  initial,
  compact = false,
  authenticated = true,
}: {
  initial: PollWithResults;
  compact?: boolean;
  authenticated?: boolean;
}) {
  const { locale, t } = useLocale();
  const [poll, setPoll] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "voting" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(initial.hasVoted);
  const closed = new Date(poll.poll.closesAt).getTime() < Date.now();
  const reveal = showResults || poll.hasVoted || closed;

  async function vote() {
    if (!selected || poll.hasVoted || closed) return;
    setStatus("voting");
    setMessage(null);
    try {
      const response = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pollId: poll.poll.id, optionId: selected }),
      });
      const data = (await response.json()) as PollResponse;
      if (!response.ok || !data.ok) {
        if (data.reason === "duplicate") {
          setPoll((current) => ({ ...current, hasVoted: true }));
          setShowResults(true);
          setMessage(t.polls.duplicate);
          setStatus("idle");
          return;
        }
        throw new Error(data.error ?? "Vote failed");
      }
      setPoll((current) => ({
        ...current,
        counts: data.counts ?? current.counts,
        totalVotes: data.totalVotes ?? current.totalVotes,
        hasVoted: true,
      }));
      setShowResults(true);
      setMessage(t.polls.thanks);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5",
        compact && "p-4",
      )}
      aria-labelledby={`poll-${poll.poll.id}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">
          <IconPoll className="h-3 w-3" /> {locale === "hi" ? "सामुदायिक पोल" : "Community poll"}
        </Badge>
        {poll.poll.sponsored ? <Badge tone="gold">{t.polls.sponsored}</Badge> : null}
        {poll.poll.isDemo ? <DemoBadge label={t.polls.demo} /> : null}
        <span className="ml-auto text-[0.66rem] text-navy-400">
          {t.polls.closes}: {formatDate(poll.poll.closesAt, locale)}
        </span>
      </div>

      <h3 id={`poll-${poll.poll.id}`} className="hindi text-[1.02rem] font-extrabold leading-snug text-navy-900">
        {pick(poll.poll.question, locale)}
      </h3>
      {!compact ? (
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-navy-600">{pick(poll.poll.description, locale)}</p>
      ) : null}

      <div className="mt-3 space-y-1.5" role="group" aria-label={locale === "hi" ? "पोल विकल्प" : "Poll options"}>
        {poll.poll.options.map((option) => {
          const count = poll.counts[option.id] ?? 0;
          const percent = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
          const isSelected = selected === option.id;
          const isWinner = reveal && poll.totalVotes > 0 && count === Math.max(...Object.values(poll.counts));
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (!poll.hasVoted && !closed) setSelected(option.id);
              }}
              disabled={poll.hasVoted || closed}
              aria-pressed={isSelected}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-[0.82rem] font-semibold transition",
                isSelected && !reveal
                  ? "border-brand-500 bg-brand-50 text-brand-900"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-300",
                (poll.hasVoted || closed) && "cursor-default",
              )}
            >
              {reveal ? (
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 -z-0 transition-all",
                    isWinner ? "bg-teal-100" : "bg-navy-100/70",
                  )}
                  style={{ width: `${percent}%` }}
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected || (reveal && isWinner)
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-navy-300 bg-white",
                  )}
                  aria-hidden
                >
                  {isSelected || (reveal && isWinner) ? <IconCheck className="h-2.5 w-2.5" /> : null}
                </span>
                <span className="flex-1">{pick(option.label, locale)}</span>
                {reveal ? (
                  <span className="shrink-0 text-[0.72rem] font-bold tabular-nums text-navy-700">
                    {percent}% <span className="font-medium text-navy-400">({count})</span>
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!poll.hasVoted && !closed && authenticated ? (
          <button
            type="button"
            onClick={vote}
            disabled={!selected || status === "voting"}
            className={buttonClass("primary", "sm")}
          >
            {status === "voting" ? t.common.sending : t.polls.vote}
          </button>
        ) : null}
        {!poll.hasVoted && !closed && !authenticated ? (
          <Link href="/account" className={buttonClass("primary", "sm")}>
            {t.polls.loginToVote}
          </Link>
        ) : null}
        {!reveal ? (
          <button type="button" onClick={() => setShowResults(true)} className={buttonClass("ghost", "sm")}>
            {t.common.results}
          </button>
        ) : (
          <button type="button" onClick={() => setShowResults(false)} className={buttonClass("ghost", "sm")}>
            {locale === "hi" ? "नतीजे छिपाएँ" : "Hide results"}
          </button>
        )}
        <span className="ml-auto text-[0.7rem] font-medium text-navy-500">
          {t.polls.totalVotes}: <strong className="text-navy-800">{poll.totalVotes}</strong>
        </span>
      </div>

      {message ? (
        <p
          role="status"
          className={cn(
            "mt-2 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-medium",
            status === "error" ? "bg-red-50 text-red-800" : "bg-teal-50 text-teal-800",
          )}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-auto pt-3 text-[0.66rem] leading-relaxed text-navy-400">{t.polls.disclaimer}</p>
    </section>
  );
}
