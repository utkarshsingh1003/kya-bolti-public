import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";
import { quizzes } from "@/data/quizzes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const quizSlug = url.searchParams.get("quiz") ?? undefined;
  if (quizSlug && !quizzes.some((quiz) => quiz.slug === quizSlug)) {
    return Response.json({ ok: false, error: "Unknown quiz." }, { status: 404 });
  }
  const repo = await getRepository();
  const entries = await repo.listLeaderboard(quizSlug, 25);
  return noStore({ ok: true, entries, quizSlug: quizSlug ?? null });
}
