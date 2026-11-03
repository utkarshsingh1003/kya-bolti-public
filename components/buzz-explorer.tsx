"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { pick } from "@/lib/i18n";
import { Badge, EmptyState } from "@/components/ui";
import { IconExternal, IconNews } from "@/components/icons";
import type { BuzzPost } from "@/lib/types";

type BuzzResponse = {
  ok?: boolean;
  posts?: BuzzPost[];
  communitySubmissions?: number;
  error?: string;
};

export function BuzzExplorer() {
  const { locale, t } = useLocale();
  const [posts, setPosts] = useState<BuzzPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/buzz", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: BuzzResponse) => {
        if (!active) return;
        if (data.ok && data.posts) setPosts(data.posts);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="container-page py-8 text-sm font-semibold text-red-800">{t.common.error}</p>;
  if (posts === null) return <p className="container-page py-8 text-sm font-semibold text-navy-500">{t.common.loading}</p>;

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="mb-6 rounded-xl border border-navy-100 bg-white px-4 py-3 text-[0.75rem] leading-relaxed text-navy-500">
        {t.trending.aiUnavailable}
      </p>
      {posts.length === 0 ? (
        <EmptyState icon={<IconNews className="h-7 w-7" />} title={t.trending.empty} />
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="brand">{t.trending.categories[post.category as keyof typeof t.trending.categories]}</Badge>
                <Badge tone="outline">{post.platform}</Badge>
                {post.origin === "admin" ? <Badge tone="gold">{t.trending.adminPost}</Badge> : null}
              </div>
              <h2 className="hindi mt-3 text-lg font-extrabold text-navy-900">{pick(post.title, locale)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{pick(post.summary, locale)}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {post.sourceUrl ? (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[0.72rem] font-bold text-brand-700 underline-offset-2 hover:underline"
                  >
                    {t.trending.source} <IconExternal className="h-3 w-3" />
                  </a>
                ) : null}
                {post.publishedAt ? (
                  <span className="text-[0.66rem] text-navy-400">
                    {t.trending.verifiedAt}: {new Date(post.publishedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
