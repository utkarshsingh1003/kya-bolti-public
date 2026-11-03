"use client";

import { useEffect, useMemo, useState } from "react";
import { PollCard } from "@/components/poll-card";
import { useLocale } from "@/components/locale-context";
import { Alert, EmptyState, buttonClass } from "@/components/ui";
import { IconPoll } from "@/components/icons";
import { PollRequestForm } from "@/components/poll-request-form";
import { AdSlot } from "@/components/ad-slot";
import type { PollWithResults } from "@/lib/types";

type PollsResponse = {
  ok?: boolean;
  polls?: PollWithResults[];
  persistent?: boolean;
  storage?: string;
  authenticated?: boolean;
  error?: string;
};

const categories = ["all", "civic", "awareness", "services"] as const;

const categoryNames = {
  all: { hi: "सभी", en: "All" },
  civic: { hi: "नागरिक मुद्दे", en: "Civic issues" },
  awareness: { hi: "जागरूकता", en: "Awareness" },
  services: { hi: "सेवाएँ", en: "Services" },
} as const;

export function PollsExplorer() {
  const { locale } = useLocale();
  const [polls, setPolls] = useState<PollWithResults[] | null>(null);
  const [error, setError] = useState(false);
  const [storage, setStorage] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    fetch("/api/polls", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: PollsResponse) => {
        if (!active) return;
        if (data.ok && data.polls) {
          setPolls(data.polls);
          setStorage(data.storage ?? null);
          setPersistent(data.persistent !== false);
          setAuthenticated(Boolean(data.authenticated));
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const visible = useMemo(
    () => (polls ?? []).filter((item) => category === "all" || item.poll.category === category),
    [polls, category],
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={buttonClass(category === item ? "secondary" : "outline", "sm")}
            aria-pressed={category === item}
          >
            {locale === "hi" ? categoryNames[item].hi : categoryNames[item].en}
          </button>
        ))}
        <span className="ml-auto text-[0.72rem] font-medium text-navy-500">
          {polls ? `${visible.length} ${locale === "hi" ? "पोल" : "polls"}` : null}
        </span>
      </div>

      {!persistent && polls ? (
        <Alert
          tone="warning"
          className="mb-5"
          title={
            storage === "demo"
              ? locale === "hi"
                ? "पोल वोटिंग अभी उपलब्ध नहीं है"
                : "Poll voting is temporarily unavailable"
              : locale === "hi"
                ? "वोट स्थायी रूप से सहेजे नहीं जा रहे"
                : "Votes are not being stored permanently"
          }
        >
          {storage === "demo"
            ? locale === "hi"
              ? "यह डेमो मोड है — पोल दिख रहे हैं, लेकिन वोटिंग डेटाबेस चालू होने तक उपलब्ध नहीं है। दिखाए गए नतीजे डेमो डेटा हैं।"
              : "This is demo mode — polls are visible, but voting is unavailable until the database is enabled. Displayed results are demo data."
            : locale === "hi"
              ? "इस डिप्लॉयमेंट में डेटाबेस नहीं जुड़ा है। वोट केवल इस सर्वर इंस्टेंस की मेमोरी में रहते हैं और रीस्टार्ट पर मिट सकते हैं। स्थायी संग्रह के लिए PostgreSQL कॉन्फ़िगर करें।"
              : "No database is connected on this deployment. Votes live only in this server instance's memory and may reset. Configure PostgreSQL for durable storage."}
          {storage ? <span className="mt-1 block text-[0.7rem] opacity-80">storage: {storage}</span> : null}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" className="mb-5">
          {locale === "hi" ? "पोल लोड नहीं हो सके।" : "Could not load polls."}{" "}
          <button type="button" className="underline" onClick={() => setReloadKey((key) => key + 1)}>
            {locale === "hi" ? "फिर कोशिश करें" : "Try again"}
          </button>
        </Alert>
      ) : null}

      {polls === null && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-64 animate-pulse rounded-2xl border border-navy-100 bg-white/70" />
          ))}
        </div>
      ) : null}

      {polls && visible.length === 0 ? (
        <EmptyState
          icon={<IconPoll className="h-7 w-7" />}
          title={locale === "hi" ? "इस श्रेणी में कोई पोल नहीं" : "No polls in this category"}
          description={locale === "hi" ? "दूसरी श्रेणी चुनें।" : "Try another category."}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((poll) => (
          <PollCard key={poll.poll.id} initial={poll} authenticated={authenticated} />
        ))}
      </div>

      <div className="mt-6">
        <AdSlot placement="polls" />
      </div>

      <div className="mt-6">
        <PollRequestForm />
      </div>

      <p className="mt-6 rounded-xl border border-navy-100 bg-white px-4 py-3 text-[0.75rem] leading-relaxed text-navy-500">
        {locale === "hi"
          ? "पोल के नतीजे केवल इस मंच पर भाग लेने वालों की राय हैं। खाता आधारित एक-व्यक्ति-एक-वोट नियम सर्वर पर लागू है। इन्हें किसी सर्वेक्षण, चुनाव पूर्वानुमान या जनमत के प्रतिनिधि नमूने के रूप में न पढ़ें।"
          : "Poll results reflect only people who participated here. One vote per account is enforced on the server. Do not read these as a survey, election forecast or representative sample of public opinion."}
      </p>
    </div>
  );
}
