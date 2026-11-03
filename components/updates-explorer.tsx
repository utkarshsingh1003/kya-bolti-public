"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { pick } from "@/lib/i18n";
import { Badge, EmptyState } from "@/components/ui";
import { IconExternal, IconNews } from "@/components/icons";
import type { Announcement } from "@/lib/types";

type UpdatesResponse = {
  ok?: boolean;
  updates?: Announcement[];
  storage?: string;
  error?: string;
};

export function UpdatesExplorer() {
  const { locale, t } = useLocale();
  const [updates, setUpdates] = useState<Announcement[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/updates", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: UpdatesResponse) => {
        if (!active) return;
        if (data.ok && data.updates) setUpdates(data.updates);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container-page py-8 sm:py-10">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {t.common.error}
        </p>
      ) : null}

      {updates === null && !error ? (
        <p className="rounded-xl border border-navy-100 bg-white px-4 py-10 text-center text-sm font-semibold text-navy-500" aria-busy="true">
          {t.common.loading}
        </p>
      ) : null}

      {updates && updates.length === 0 ? (
        <EmptyState icon={<IconNews className="h-7 w-7" />} title={t.updates.empty} />
      ) : null}

      <div className="grid gap-4">
        {(updates ?? []).map((update) => (
          <article key={update.id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{t.updates.categories[update.category as keyof typeof t.updates.categories]}</Badge>
              {update.status ? <Badge tone="neutral">{update.status}</Badge> : null}
              <span className="ml-auto text-[0.66rem] text-navy-400">
                {t.updates.published}: {update.publishAt ? new Date(update.publishAt).toLocaleString() : new Date(update.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="hindi mt-3 text-lg font-extrabold text-navy-900">{pick(update.title, locale)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-700">{pick(update.body, locale)}</p>
            {update.sourceUrl ? (
              <a
                href={update.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-bold text-brand-700 underline-offset-2 hover:underline"
              >
                {t.updates.source} <IconExternal className="h-3 w-3" />
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
