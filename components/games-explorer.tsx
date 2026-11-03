"use client";

import { Badge } from "@/components/ui";
import { DailyQuizCard } from "@/components/daily-quiz-card";
import { useAuth } from "@/components/auth-hook";
import { useLocale } from "@/components/locale-context";

export function GamesExplorer() {
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <div className="container-page pb-8 sm:pb-10">
      <DailyQuizCard />
      {user ? (
        <div className="mt-5 rounded-2xl border border-navy-100 bg-white p-5 text-center shadow-card">
          <Badge tone="teal">{user.displayName}</Badge>
          <p className="mt-2 text-[0.78rem] text-navy-600">
            {user.displayName} · {user.id.slice(0, 8)}
          </p>
        </div>
      ) : null}
      <div className="mt-6 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-extrabold text-navy-900">{t.games.leaderboardTitle}</h2>
        <p className="mt-1 text-[0.7rem] text-navy-500">{t.games.leaderboardSub}</p>
      </div>
    </div>
  );
}
