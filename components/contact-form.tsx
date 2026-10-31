"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { FormStatus, TextAreaField, TextField } from "@/components/form-controls";
import { buttonClass } from "@/components/ui";
import { IconCheck } from "@/components/icons";

export function ContactForm() {
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email: email || undefined, subject, message, consent }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? (locale === "hi" ? "संदेश भेजा नहीं जा सका।" : "Could not send the message."));
        setState("error");
        return;
      }
      setState("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setConsent(false);
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <IconCheck className="h-5 w-5" />
        </span>
        <h2 className="hindi mt-3 text-xl font-extrabold text-navy-900">
          {locale === "hi" ? "संदेश मिल गया" : "Message received"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          {locale === "hi"
            ? "धन्यवाद। हमारी टीम संदेश की समीक्षा करेगी। कृपया ध्यान दें कि यह कोई तत्काल सहायता चैनल नहीं है।"
            : "Thank you. Our team will review the message. Please note this is not an immediate-response support channel."}
        </p>
        <button type="button" onClick={() => setState("idle")} className={buttonClass("outline", "sm", "mt-4")}>
          {locale === "hi" ? "दूसरा संदेश भेजें" : "Send another message"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label={locale === "hi" ? "आपका नाम" : "Your name"}
            hint={locale === "hi" ? "वैकल्पिक" : "optional"}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label={locale === "hi" ? "ईमेल" : "Email"}
            hint={locale === "hi" ? "वैकल्पिक" : "optional"}
            type="email"
            maxLength={200}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <TextField
          label={locale === "hi" ? "विषय" : "Subject"}
          required
          minLength={4}
          maxLength={120}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={locale === "hi" ? "जैसे: सुधार अनुरोध / साइट पर समस्या" : "e.g. Correction request / Site problem"}
        />
        <TextAreaField
          label={locale === "hi" ? "संदेश" : "Message"}
          hint={locale === "hi" ? "20–2000 अक्षर" : "20–2000 characters"}
          required
          minLength={20}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            locale === "hi"
              ? "कृपया विवरण, पेज का लिंक और यदि लागू हो तो आधिकारिक स्रोत दें। निजी जानकारी न लिखें।"
              : "Include details, the page link and an official source if applicable. Do not include private data."
          }
        />
        <label className="flex items-start gap-2.5 rounded-xl bg-navy-50 px-3.5 py-3 text-[0.78rem] leading-relaxed text-navy-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <span>
            {locale === "hi"
              ? "मैं पुष्टि करता/करती हूँ कि इस संदेश में किसी की निजी जानकारी, धमकी या स्पैम नहीं है।"
              : "I confirm this message contains no one's private information, threats or spam."}
          </span>
        </label>
        {error ? <FormStatus tone="error">{error}</FormStatus> : null}
        <button type="submit" disabled={state === "sending" || !consent} className={buttonClass("primary", "lg", "justify-self-start")}>
          {state === "sending" ? (locale === "hi" ? "भेज रहे हैं…" : "Sending…") : locale === "hi" ? "संदेश भेजें" : "Send message"}
        </button>
        <p className="text-[0.68rem] text-navy-400">
          {locale === "hi"
            ? "ईमेल देने पर वह केवल जवाब देने के लिए उपयोग होगा और सार्वजनिक नहीं दिखाया जाएगा।"
            : "If you provide an email, it is used only to reply and is never shown publicly."}
        </p>
      </div>
    </form>
  );
}
