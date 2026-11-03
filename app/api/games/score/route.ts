import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { quizScoreSchema } from "@/lib/validation";
import { requireUser } from "@/lib/accounts";
import { quizzes } from "@/data/quizzes";
import { scoreQuiz } from "@/lib/quiz";

export const dynamic = "force-dynamic";

/**
 * Scores are recomputed from the submitted answer sheet against the verified
 * question bank. The client cannot submit an arbitrary score or total.
 */
export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "quiz-score", limit: 30, windowMs: 60 * 60 * 1000 });
  if (guard) return guard;
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = quizScoreSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const quiz = quizzes.find((item) => item.slug === parsed.data.quizSlug);
  if (!quiz) return NextResponse.json({ ok: false, error: "Unknown quiz." }, { status: 404 });
  if (parsed.data.answers.length !== quiz.questions.length) {
    return NextResponse.json({ ok: false, error: "Answer sheet does not match this quiz." }, { status: 400 });
  }
  for (const [index, answer] of parsed.data.answers.entries()) {
    const question = quiz.questions[index]!;
    if (answer < -1 || answer >= question.options.length) {
      return NextResponse.json({ ok: false, error: "Invalid answer option." }, { status: 400 });
    }
  }

  const score = scoreQuiz(quiz, parsed.data.answers);
  const repo = await getRepository();
  const saved = await repo.upsertQuizScore(auth.user.id, quiz.slug, score, quiz.questions.length);
  return noStore({
    ok: true,
    score,
    total: quiz.questions.length,
    best: saved.score,
    displayName: auth.user.displayName,
  });
}
