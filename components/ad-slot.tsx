"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { Badge } from "@/components/ui";

type PublicAd = {
  id: string;
  advertiserName: string;
  placement: string;
  destinationUrl: string;
  creativeUrl: string | null;
  campaignEnd: string | null;
};

export function AdSlot({ placement }: { placement: "homepage" | "polls" | "trending" | "updates" | "newsletter" }) {
  const { locale, t } = useLocale();
  const [ads, setAds] = useState<PublicAd[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/ads/active", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { ok?: boolean; ads?: PublicAd[] }) => {
        if (active && data.ok && data.ads) setAds(data.ads.filter((ad) => ad.placement === placement));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [placement]);

  if (ads.length === 0) return null;

  return (
    <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label={t.ads.label}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">{t.ads.label}</Badge>
        <span className="text-[0.66rem] text-amber-800">
          {locale === "hi" ? "भुगतान सत्यापित प्रायोजित प्लेसमेंट" : "Payment-verified sponsored placement"}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {ads.map((ad) => (
          <li key={ad.id} className="rounded-xl border border-amber-200 bg-white px-3 py-2.5">
            <a
              href={ad.destinationUrl}
              target="_blank"
              rel="noreferrer noopener sponsored"
              className="text-sm font-bold text-navy-900 underline-offset-2 hover:underline"
            >
              {ad.advertiserName}
            </a>
            {ad.creativeUrl ? (
              // Remote images are linked, not proxied; advertisers are responsible for rights.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.creativeUrl} alt="" className="mt-2 max-h-28 rounded-lg object-contain" loading="lazy" />
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
