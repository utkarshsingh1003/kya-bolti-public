"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { LocationFields, TextAreaField, TextField, FormStatus, SelectField } from "@/components/form-controls";
import { Alert, ButtonLink, buttonClass } from "@/components/ui";
import { IconCheck, IconExternal, IconPin } from "@/components/icons";
import { issueCategories } from "@/lib/validation";
import { issueCategoryLabels } from "@/lib/labels";

type SubmitState = "idle" | "sending" | "error";

const officialPortals: Record<string, { label: string; url: string }[]> = {
  up: [
    { label: "जनसुनवाई, उत्तर प्रदेश", url: "https://jansunwai.up.nic.in/" },
    { label: "नगरीय विकास विभाग, उत्तर प्रदेश", url: "https://urban.up.nic.in/" },
  ],
  bihar: [
    { label: "बिहार जलापूर्ति / शिकायत", url: "https://biharjalapurti.in/" },
    { label: "बिहार सरकार", url: "https://state.bihar.gov.in/" },
  ],
};

export function IssueForm({ initialCategory }: { initialCategory?: string }) {
  const { locale } = useLocale();
  const { location, hydrated } = useLocation();
  const touched = useRef(false);
  const [stateId, setStateId] = useState(location.stateId);
  const [districtId, setDistrictId] = useState(location.districtId);
  const [category, setCategory] = useState(
    issueCategories.includes(initialCategory as (typeof issueCategories)[number])
      ? (initialCategory as (typeof issueCategories)[number])
      : "roads",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [pin, setPin] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackingCode: string; persistent: boolean } | null>(null);

  // Once the saved location hydrates, adopt it only if the user has not changed the form yet.
  useEffect(() => {
    if (hydrated && !touched.current) {
      setStateId(location.stateId);
      setDistrictId(location.districtId);
    }
  }, [hydrated, location.stateId, location.districtId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("sending");
    setError(null);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          area,
          districtId,
          stateId,
          pin: pin || undefined,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        trackingCode?: string;
        persistent?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.trackingCode) {
        setError(data.error ?? (locale === "hi" ? "समस्या दर्ज नहीं हो सकी।" : "Could not submit the issue."));
        setSubmitState("error");
        return;
      }
      setResult({ trackingCode: data.trackingCode, persistent: data.persistent !== false });
      setSubmitState("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई। फिर कोशिश करें।" : "Network error. Please try again.");
      setSubmitState("error");
    }
  }

  if (result) {
    return (
      <div className="container-page max-w-2xl py-10">
        <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-card sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <IconCheck className="h-6 w-6" />
          </span>
          <h1 className="hindi mt-4 text-2xl font-extrabold text-navy-900">
            {locale === "hi" ? "समस्या दर्ज हो गई" : "Issue submitted"}
          </h1>
          <p className="mt-2 text-sm text-navy-600">
            {locale === "hi"
              ? "अपना ट्रैकिंग कोड सहेजें। इसी कोड से आप स्थिति देख सकते हैं।"
              : "Save your tracking code. You can use it to check the status."}
          </p>
          <p className="mt-4 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-center font-mono text-2xl font-extrabold tracking-[0.2em] text-brand-800">
            {result.trackingCode}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={`/issues?code=${encodeURIComponent(result.trackingCode)}`} size="md">
              {locale === "hi" ? "स्थिति देखें" : "Check status"}
            </ButtonLink>
            <ButtonLink href="/issues/new" variant="outline" size="md">
              {locale === "hi" ? "दूसरी समस्या दर्ज करें" : "Report another issue"}
            </ButtonLink>
            <ButtonLink href="/issues" variant="ghost" size="md">
              {locale === "hi" ? "सभी समस्याएँ" : "All issues"}
            </ButtonLink>
          </div>
          {!result.persistent ? (
            <Alert tone="warning" className="mt-4">
              {locale === "hi"
                ? "इस डिप्लॉयमेंट में डेटाबेस नहीं है — यह प्रविष्टि सर्वर रीस्टार्ट पर मिट सकती है। आधिकारिक पोर्टल पर भी शिकायत दर्ज करें।"
                : "No database is configured on this deployment — this entry may be lost when the server restarts. Also file on the official portal."}
            </Alert>
          ) : null}
          <a
            href={officialPortals[stateId]?.[0]?.url ?? "https://www.india.gov.in/"}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-700 underline-offset-2 hover:underline"
          >
            {locale === "hi" ? "आधिकारिक पोर्टल पर भी शिकायत दर्ज करें" : "Also file on the official portal"}
            <IconExternal className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <form onSubmit={submit} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6" noValidate>
        <div className="grid gap-4">
          <SelectField
            label={locale === "hi" ? "समस्या की श्रेणी" : "Issue category"}
            required
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            {issueCategories.map((item) => (
              <option key={item} value={item}>
                {issueCategoryLabels[item]?.[locale] ?? item}
              </option>
            ))}
          </SelectField>

          <TextField
            label={locale === "hi" ? "समस्या का शीर्षक" : "Issue title"}
            hint={locale === "hi" ? "8–140 अक्षर" : "8–140 characters"}
            required
            minLength={8}
            maxLength={140}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={locale === "hi" ? "जैसे: बाज़ार रोड पर गहरे गड्ढे" : "e.g. Deep potholes on Bazaar Road"}
          />

          <TextAreaField
            label={locale === "hi" ? "क्या हुआ? कब और कहाँ?" : "What happened? When and where?"}
            hint={locale === "hi" ? "20–2000 अक्षर" : "20–2000 characters"}
            required
            minLength={20}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={
              locale === "hi"
                ? "समस्या का विवरण दें। कृपया फ़ोन नंबर, घर का सटीक पता या व्यक्तिगत जानकारी न लिखें।"
                : "Describe the issue. Do not include phone numbers, exact home addresses or personal details."
            }
          />

          <TextField
            label={locale === "hi" ? "इलाका / मोहल्ला (घर का पता नहीं)" : "Area / neighbourhood (not your home address)"}
            required
            minLength={3}
            maxLength={80}
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder={locale === "hi" ? "जैसे: बाज़ार रोड, वार्ड 12" : "e.g. Bazaar Road, Ward 12"}
          />

          <LocationFields
            stateId={stateId}
            districtId={districtId}
            onStateChange={(nextState, nextDistrict) => {
              touched.current = true;
              setStateId(nextState);
              setDistrictId(nextDistrict);
            }}
            onDistrictChange={(nextDistrict) => {
              touched.current = true;
              setDistrictId(nextDistrict);
            }}
            disabled={submitState === "sending"}
          />

          <TextField
            label={locale === "hi" ? "पिन कोड" : "PIN code"}
            hint={locale === "hi" ? "वैकल्पिक" : "optional"}
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="226001"
          />

          <label className="flex items-start gap-2.5 rounded-xl bg-navy-50 px-3.5 py-3 text-[0.78rem] leading-relaxed text-navy-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span>
              {locale === "hi"
                ? "मैं पुष्टि करता/करती हूँ कि यह जानकारी सही है, इसमें किसी व्यक्ति के खिलाफ धमकी या निजी जानकारी नहीं है, और मैं समझता/समझती हूँ कि यह सरकारी शिकायत दर्ज नहीं करता।"
                : "I confirm this information is accurate, contains no threats or personal data about others, and I understand this does not register a government complaint."}
            </span>
          </label>

          {error ? <FormStatus tone="error">{error}</FormStatus> : null}

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={submitState === "sending" || !confirmed} className={buttonClass("primary", "lg")}>
              {submitState === "sending"
                ? locale === "hi"
                  ? "भेज रहे हैं…"
                  : "Submitting…"
                : locale === "hi"
                  ? "समस्या भेजें"
                  : "Submit issue"}
            </button>
            <Link href="/issues" className="text-sm font-semibold text-navy-600 underline-offset-2 hover:underline">
              {locale === "hi" ? "रद्द करें" : "Cancel"}
            </Link>
          </div>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-amber-950">
            <IconPin className="h-4 w-4" /> {locale === "hi" ? "निजी जानकारी न लिखें" : "Do not include personal data"}
          </h2>
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-amber-900">
            {locale === "hi"
              ? "सार्वजनिक पोस्ट में फ़ोन नंबर, घर का सटीक पता, आधार नंबर या किसी अन्य व्यक्ति की निजी जानकारी न डालें।"
              : "Do not post phone numbers, exact home addresses, ID numbers or anyone else's private information."}
          </p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
          <h2 className="text-sm font-extrabold text-navy-900">
            {locale === "hi" ? "आधिकारिक शिकायत पोर्टल" : "Official complaint portals"}
          </h2>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-navy-500">
            {locale === "hi"
              ? "यह मंच सरकारी शिकायत दर्ज नहीं करता। कृपया संबंधित आधिकारिक पोर्टल का भी उपयोग करें।"
              : "This platform does not register a government complaint. Please also use the relevant official portal."}
          </p>
          <ul className="mt-2 space-y-1.5">
            {(officialPortals[stateId] ?? officialPortals.up!).map((portal) => (
              <li key={portal.url}>
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  {portal.label} <IconExternal className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="px-1 text-[0.68rem] leading-relaxed text-navy-400">
          {locale === "hi"
            ? "सबमिट करने पर डेटा स्थानीय रिकॉर्ड में सहेजा जाता है। डेटाबेस कॉन्फ़िगर न होने पर यह अस्थायी हो सकता है।"
            : "Submitted data is stored in a local record. Without a configured database it may be temporary."}
        </p>
      </aside>
    </div>
  );
}
