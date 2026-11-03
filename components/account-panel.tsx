"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { FormStatus } from "@/components/form-controls";
import { buttonClass } from "@/components/ui";
import type { PublicUser, QuizScore } from "@/lib/types";

type MeResponse = { ok?: boolean; configured?: boolean; user?: PublicUser | null };
type SubmissionsResponse = {
  ok?: boolean;
  issues?: { id: string; trackingCode: string; title: string; status: string; createdAt: string; ownerId?: string | null }[];
  pollRequests?: { id: string; status: string; questionHi: string; createdAt: string; ownerId?: string | null }[];
  quizScores?: QuizScore[];
  error?: string;
};

export function AccountPanel() {
  const { t } = useLocale();
  const { location, openLocation, closeLocation } = useLocation();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionsResponse | null>(null);

  const loadMe = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    const data = (await response.json()) as MeResponse;
    setConfigured(Boolean(data.configured));
    setUser(data.user ?? null);
    if (data.user) setDisplayName(data.user.displayName);
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (!user) {
      setSubmissions(null);
      return;
    }
    fetch("/api/account/submissions")
      .then((response) => response.json())
      .then((data: SubmissionsResponse) => setSubmissions(data ?? { ok: false }))
      .catch(() => setSubmissions({ ok: false }));
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; user?: PublicUser };
      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? t.common.error);
        return;
      }
      setStatus("done");
      setMessage(t.account.profileSaved);
      await loadMe();
    } catch {
      setStatus("error");
      setMessage(t.common.error);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    await loadMe();
  }

  if (configured === null) {
    return <p className="text-sm font-semibold text-navy-500">{t.common.loading}</p>;
  }
  if (configured === false) {
    return <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.account.notConfigured}</p>;
  }

  if (!user) {
    return (
      <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="hindi text-lg font-extrabold text-navy-900">{mode === "login" ? t.account.login : t.account.register}</h2>
        <label className="mt-4 block space-y-1.5 text-[0.82rem] font-bold text-navy-800">
          {t.account.email}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm" />
        </label>
        {mode === "register" ? (
          <label className="mt-3 block space-y-1.5 text-[0.82rem] font-bold text-navy-800">
            {t.account.displayName}
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm" />
          </label>
        ) : null}
        <label className="mt-3 block space-y-1.5 text-[0.82rem] font-bold text-navy-800">
          {t.account.password}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={10} className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm" />
        </label>
        <p className="mt-1 text-[0.68rem] text-navy-500">{t.account.passwordHelp}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={status === "saving" || password.length < 10} className={buttonClass("primary", "md")}>
            {status === "saving" ? t.common.sending : mode === "login" ? t.account.submitLogin : t.account.submitRegister}
          </button>
          <button type="button" className={buttonClass("outline", "md")} onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? t.account.noAccount : t.account.haveAccount}
          </button>
        </div>
        {message ? <div className="mt-3"><FormStatus tone={status === "error" ? "error" : "success"}>{message}</FormStatus></div> : null}
        <p className="mt-3 text-[0.7rem] leading-relaxed text-navy-500">{t.account.privacy}</p>
      </form>
    );
  }

  const savedLocation = location;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="hindi text-xl font-extrabold text-navy-900">{t.account.title}</h2>
          <p className="mt-1 text-[0.76rem] text-navy-600">{user.email} · {user.displayName}</p>
        </div>
        <button type="button" className={buttonClass("outline", "md")} onClick={() => void logout()}>
          {t.account.logout}
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="text-sm font-extrabold text-navy-900">{t.account.location}</h3>
          <p className="mt-2 text-[0.76rem] font-semibold text-navy-700">
            {savedLocation.districtId} · {savedLocation.stateId}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={openLocation}>
              {t.location.choose}
            </button>
            <button type="button" className={buttonClass("outline", "sm")} onClick={closeLocation}>
              {t.nav.close}
            </button>
          </div>
          <p className="mt-3 text-[0.7rem] leading-relaxed text-navy-500">{t.location.save}</p>
        </section>

        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h3 className="text-sm font-extrabold text-navy-900">{t.account.mySubmissions}</h3>
          {submissions?.ok === false ? <p className="mt-3 text-[0.78rem] text-red-700">{t.common.error}</p> : null}
          {(submissions?.quizScores ?? []).length > 0 ? (
            <div className="mt-2">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-navy-500">{t.account.quizScores}</p>
              <ul className="mt-1 space-y-1 text-[0.78rem] text-navy-700">
                {(submissions?.quizScores ?? []).map((score) => (
                  <li key={score.id}>
                    {score.quizSlug} · {score.score}/{score.total}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(submissions?.issues ?? []).length > 0 ? (
            <div className="mt-2">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-navy-500">Issues</p>
              <ul className="mt-1 space-y-1 text-[0.78rem] text-navy-700">
                {(submissions?.issues ?? []).map((issue) => (
                  <li key={issue.id}>
                    {issue.trackingCode} · {issue.title} · {issue.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(submissions?.pollRequests ?? []).length > 0 ? (
            <div className="mt-2">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-navy-500">Poll requests</p>
              <ul className="mt-1 space-y-1 text-[0.78rem] text-navy-700">
                {(submissions?.pollRequests ?? []).map((request) => (
                  <li key={request.id}>
                    {request.questionHi} · {request.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(submissions?.issues ?? []).length === 0 && (submissions?.pollRequests ?? []).length === 0 && (submissions?.quizScores ?? []).length === 0 ? (
            <p className="mt-2 text-[0.78rem] text-navy-500">{t.account.noSubmissions}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
