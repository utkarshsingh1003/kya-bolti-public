"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { TextField } from "@/components/form-controls";
import { Alert, buttonClass } from "@/components/ui";
import { IconShield } from "@/components/icons";

export function AdminLoginForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? (locale === "hi" ? "लॉगिन नहीं हो सका।" : "Login failed."));
        setState("error");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setState("error");
    }
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-6 shadow-float sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white">
          <IconShield className="h-5 w-5" />
        </span>
        <h1 className="hindi mt-4 text-2xl font-extrabold text-navy-900">
          {locale === "hi" ? "एडमिन लॉगिन" : "Admin login"}
        </h1>
        <p className="mt-1 text-[0.78rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "यह क्षेत्र केवल अधिकृत मॉडरेटर के लिए है। क्रेडेंशियल सर्वर के एनवायरनमेंट में तय किए जाते हैं; कोई डिफ़ॉल्ट पासवर्ड नहीं है।"
            : "This area is for authorised moderators only. Credentials are set in the server environment; there is no default password."}
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <TextField
            label={locale === "hi" ? "एडमिन पासवर्ड" : "Admin password"}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <button type="submit" disabled={state === "sending"} className={buttonClass("primary", "lg")}>
            {state === "sending" ? (locale === "hi" ? "जाँच रहे हैं…" : "Checking…") : locale === "hi" ? "लॉगिन करें" : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-[0.68rem] leading-relaxed text-navy-400">
          {locale === "hi"
            ? "लॉगिन प्रयास सीमित हैं। सत्र 8 घंटे तक रहता है और HttpOnly कुकी में सहेजा जाता है।"
            : "Login attempts are rate-limited. Sessions last up to 8 hours and are stored in an HttpOnly cookie."}
        </p>
      </div>
    </div>
  );
}
