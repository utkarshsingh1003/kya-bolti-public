"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { TextField, SelectField, TextAreaField, FormStatus } from "@/components/form-controls";
import { buttonClass } from "@/components/ui";

const buzzCategories = [
  { id: "trending", hi: "ट्रेंडिंग", en: "Trending" },
  { id: "news", hi: "खबरें", en: "News" },
  { id: "entertainment", hi: "मनोरंजन", en: "Entertainment" },
  { id: "sports", hi: "खेल", en: "Sports" },
  { id: "memes", hi: "मीम्स", en: "Memes" },
  { id: "public_issues", hi: "जन-मुद्दे", en: "Public issues" },
] as const;

export function BuzzLinkForm() {
  const { locale, t } = useLocale();
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [category, setCategory] = useState<(typeof buzzCategories)[number]["id"]>("trending");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 6) return;
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/buzz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, sourceUrl, platform, category, note }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? t.common.error);
        return;
      }
      setStatus("done");
      setMessage(t.trending.submitSuccess);
      setTitle("");
      setSourceUrl("");
      setNote("");
    } catch {
      setStatus("error");
      setMessage(t.common.error);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <h2 className="hindi text-lg font-extrabold text-navy-900">{t.trending.submitTitle}</h2>
      <p className="mt-1 text-[0.78rem] leading-relaxed text-navy-600">{t.trending.submitHelp}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField label={t.trending.submitTitle} required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />
        <TextField
          label={t.trending.source}
          required
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://"
        />
        <SelectField label={t.trending.platform} value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="youtube">YouTube</option>
          <option value="twitter">X / Twitter</option>
          <option value="instagram">Instagram</option>
          <option value="news">News site</option>
          <option value="video">Video</option>
          <option value="other">Other</option>
        </SelectField>
        <SelectField
          label={t.trending.category}
          value={category}
          onChange={(event) => setCategory(event.target.value as (typeof buzzCategories)[number]["id"])}
        >
          {buzzCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {locale === "hi" ? item.hi : item.en}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label={t.trending.submitTitle}
        className="mt-3"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={300}
      />
      {message ? <div className="mt-3"><FormStatus tone={status === "error" ? "error" : "success"}>{message}</FormStatus></div> : null}
      <button type="submit" disabled={title.trim().length < 6 || sourceUrl.trim().length < 8 || status === "saving"} className={buttonClass("primary", "md", "mt-4")}>
        {status === "saving" ? t.common.sending : t.common.submit}
      </button>
    </form>
  );
}
