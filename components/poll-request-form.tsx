"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { LocationFields, TextAreaField, TextField, FormStatus, inputClass } from "@/components/form-controls";
import { buttonClass } from "@/components/ui";

const categories = [
  { id: "civic", hi: "नागरिक मुद्दे", en: "Civic issues" },
  { id: "local", hi: "स्थानीय", en: "Local" },
  { id: "services", hi: "सेवाएँ", en: "Services" },
  { id: "awareness", hi: "जागरूकता", en: "Awareness" },
] as const;

export function PollRequestForm() {
  const { locale, t } = useLocale();
  const { location } = useLocation();
  const [stateId, setStateId] = useState(location.stateId);
  const [districtId, setDistrictId] = useState(location.districtId);
  const [questionHi, setQuestionHi] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [optionsHi, setOptionsHi] = useState(["", "", ""]);
  const [optionsEn, setOptionsEn] = useState(["", "", ""]);
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("civic");
  const [purpose, setPurpose] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const cleanOptionsHi = optionsHi.map((value) => value.trim()).filter(Boolean);
  const cleanOptionsEn = optionsEn.map((value) => value.trim()).filter(Boolean);
  const valid =
    questionHi.trim().length >= 10 &&
    questionEn.trim().length >= 10 &&
    cleanOptionsHi.length >= 2 &&
    cleanOptionsHi.length === cleanOptionsEn.length &&
    purpose.trim().length >= 20 &&
    consent;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/poll-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionHi: questionHi.trim(),
          questionEn: questionEn.trim(),
          optionsHi: cleanOptionsHi,
          optionsEn: cleanOptionsEn,
          category,
          purpose: purpose.trim(),
          contact: contact.trim() || undefined,
          stateId,
          districtId,
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
      setMessage(t.polls.requestSuccess);
      setQuestionHi("");
      setQuestionEn("");
      setOptionsHi(["", "", ""]);
      setOptionsEn(["", "", ""]);
      setPurpose("");
      setContact("");
      setConsent(false);
    } catch {
      setStatus("error");
      setMessage(t.common.error);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <h2 className="hindi text-lg font-extrabold text-navy-900">{t.polls.requestTitle}</h2>
      <p className="mt-1 text-[0.78rem] leading-relaxed text-navy-600">{t.polls.requestSubtitle}</p>

      <div className="mt-4 grid gap-3">
        <TextField
          label={locale === "hi" ? "सवाल (हिंदी)" : "Question (Hindi)"}
          required
          value={questionHi}
          onChange={(event) => setQuestionHi(event.target.value)}
          maxLength={200}
          placeholder={locale === "hi" ? "आप क्या पूछना चाहते हैं?" : "What do you want to ask?"}
        />
        <TextField
          label={locale === "hi" ? "सवाल (अंग्रेज़ी)" : "Question (English)"}
          required
          value={questionEn}
          onChange={(event) => setQuestionEn(event.target.value)}
          maxLength={200}
          placeholder="What do you want to ask?"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[0.82rem] font-bold text-navy-800">{locale === "hi" ? "विकल्प (हिंदी)" : "Options (Hindi)"}</p>
            {optionsHi.map((value, index) => (
              <input
                key={`hi-${index}`}
                value={value}
                onChange={(event) =>
                  setOptionsHi((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                }
                maxLength={90}
                aria-label={`${locale === "hi" ? "विकल्प" : "Option"} ${index + 1} (Hindi)`}
                className={inputClass}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.82rem] font-bold text-navy-800">{locale === "hi" ? "विकल्प (अंग्रेज़ी)" : "Options (English)"}</p>
            {optionsEn.map((value, index) => (
              <input
                key={`en-${index}`}
                value={value}
                onChange={(event) =>
                  setOptionsEn((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                }
                maxLength={90}
                aria-label={`${locale === "hi" ? "विकल्प" : "Option"} ${index + 1} (English)`}
                className={inputClass}
              />
            ))}
          </div>
        </div>
        <p className="text-[0.7rem] text-navy-500">
          {locale === "hi" ? "कम से कम दो विकल्प दोनों भाषाओं में भरें।" : "Fill at least two options in both languages."}
        </p>

        <label className="block space-y-1.5 text-[0.82rem] font-bold text-navy-800">
          {t.trending.category}
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className={inputClass}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === "hi" ? item.hi : item.en}
              </option>
            ))}
          </select>
        </label>

        <LocationFields
          stateId={stateId}
          districtId={districtId}
          onStateChange={(nextState, nextDistrict) => {
            setStateId(nextState);
            setDistrictId(nextDistrict);
          }}
          onDistrictChange={setDistrictId}
        />

        <TextAreaField
          label={locale === "hi" ? "उद्देश्य" : "Purpose"}
          required
          minLength={20}
          maxLength={600}
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          hint={locale === "hi" ? "यह पोल क्यों ज़रूरी है?" : "Why is this poll useful?"}
        />
        <TextField
          label={locale === "hi" ? "संपर्क ईमेल (वैकल्पिक)" : "Contact email (optional)"}
          type="email"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="you@example.com"
        />
        <label className="flex items-start gap-2 text-[0.74rem] leading-relaxed text-navy-700">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
          <span>
            {locale === "hi"
              ? "मैं पुष्टि करता/करती हूँ कि इसमें कोई निजी या गोपनीय जानकारी नहीं है और यह अनुरोध सार्वजनिक समीक्षा के लिए है।"
              : "I confirm this contains no private or confidential information and is submitted for public review."}
          </span>
        </label>
      </div>

      {message ? (
        <div className="mt-3">
          <FormStatus tone={status === "error" ? "error" : "success"}>{message}</FormStatus>
        </div>
      ) : null}

      <button type="submit" disabled={!valid || status === "saving"} className={buttonClass("primary", "md", "mt-4")}>
        {status === "saving" ? t.common.sending : locale === "hi" ? "अनुरोध भेजें" : "Send request"}
      </button>
    </form>
  );
}
