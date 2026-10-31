"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Avoid logging user content; only a generic message in development.
    if (process.env.NODE_ENV !== "production") {
      console.error("Page error", error.message);
    }
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <p className="text-5xl font-extrabold text-brand-500">!</p>
        <h1 className="hindi mt-2 text-2xl font-extrabold text-navy-900">कुछ गड़बड़ हो गई</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          पेज लोड करने में समस्या आई। कृपया फिर कोशिश करें। अगर समस्या बनी रहे, तो संपर्क पेज से बताएँ।
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className={buttonClass("primary", "md")}>
            फिर कोशिश करें
          </button>
          <Link href="/" className={buttonClass("outline", "md")}>होम पेज</Link>
          <Link href="/contact" className={buttonClass("ghost", "md")}>संपर्क</Link>
        </div>
        {error.digest ? <p className="mt-4 font-mono text-[0.65rem] text-navy-400">Reference: {error.digest}</p> : null}
      </div>
    </div>
  );
}
