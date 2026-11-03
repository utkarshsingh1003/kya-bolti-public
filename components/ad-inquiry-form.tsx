"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { TextField, SelectField, FormStatus } from "@/components/form-controls";
import { buttonClass } from "@/components/ui";

export function AdInquiryForm() {
  const { t } = useLocale();
  const [advertiserName, setAdvertiserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [objective, setObjective] = useState("");
  const [budgetRange, setBudgetRange] = useState<string>("under_10k");
  const [placement, setPlacement] = useState<string>("polls");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [creativeUrl, setCreativeUrl] = useState("");
  const [campaignStart, setCampaignStart] = useState("");
  const [campaignEnd, setCampaignEnd] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (objective.trim().length < 20) return;
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          advertiserName,
          email,
          phone,
          objective: objective.trim(),
          budgetRange,
          placement,
          destinationUrl,
          creativeUrl: creativeUrl.trim() || undefined,
          campaignStart: campaignStart || undefined,
          campaignEnd: campaignEnd || undefined,
          consent,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? t.common.error);
        return;
      }
      setStatus("done");
      setMessage(t.ads.success);
      setObjective("");
      setDestinationUrl("");
      setCreativeUrl("");
      setCampaignStart("");
      setCampaignEnd("");
      setConsent(false);
    } catch {
      setStatus("error");
      setMessage(t.common.error);
    }
  }

  const fieldClass = "mt-3";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <h2 className="hindi text-lg font-extrabold text-navy-900">{t.ads.formTitle}</h2>
      <p className="mt-1 text-[0.78rem] leading-relaxed text-navy-600">{t.ads.subtitle}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField label={t.ads.company} required value={advertiserName} onChange={(event) => setAdvertiserName(event.target.value)} maxLength={120} />
        <TextField label={t.ads.email} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} />
        <TextField label={t.ads.phone} required value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} />
        <TextField label={t.ads.destination} required type="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} placeholder="https://example.com/campaign" maxLength={300} />
        <TextField label={t.ads.creative} value={creativeUrl} onChange={(event) => setCreativeUrl(event.target.value)} type="url" maxLength={300} />
        <TextField label={t.ads.objective} required value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={800} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SelectField label={t.ads.budget} value={budgetRange} onChange={(event) => setBudgetRange(event.target.value)}>
          {Object.entries(t.ads.budgets).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label={t.ads.placement} value={placement} onChange={(event) => setPlacement(event.target.value)}>
          {Object.entries(t.ads.placements).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField label={t.ads.start} type="date" value={campaignStart} onChange={(event) => setCampaignStart(event.target.value)} />
        <TextField label={t.ads.end} type="date" value={campaignEnd} onChange={(event) => setCampaignEnd(event.target.value)} />
      </div>

      <label className="mt-3 flex items-start gap-2 text-[0.74rem] leading-relaxed text-navy-700">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
        <span>{t.ads.consent}</span>
      </label>

      {message ? (
        <div className="mt-3">
          <FormStatus tone={status === "error" ? "error" : "success"}>{message}</FormStatus>
        </div>
      ) : null}

      <div className={fieldClass}>
        <button type="submit" disabled={objective.trim().length < 20 || status === "saving"} className={buttonClass("primary", "md", "mt-4")}>
          {status === "saving" ? t.common.sending : t.ads.submit}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50 px-4 py-3 text-[0.72rem] leading-relaxed text-navy-600">
        <p>{t.ads.policy}</p>
      </div>
    </form>
  );
}
