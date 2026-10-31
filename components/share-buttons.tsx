"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-context";
import { buttonClass } from "@/components/ui";
import { IconCheck, IconWhatsapp } from "@/components/icons";

export function ShareButtons({ title }: { title: string }) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className={buttonClass("outline", "sm")}>
        {copied ? <IconCheck className="h-4 w-4" /> : null}
        {copied ? (locale === "hi" ? "कॉपी हो गया" : "Copied") : locale === "hi" ? "लिंक कॉपी करें" : "Copy link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonClass("soft", "sm")}
      >
        <IconWhatsapp className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}
