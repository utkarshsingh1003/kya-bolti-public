import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { quizzes } from "@/data/quizzes";
import { noStore, readJson, validationError } from "@/lib/api";
import { dailyAnswerSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

type DailyQuestion = {
  quizSlug: string;
  questionId: string;
  prompt: { hi: string; en: string };
  options: { hi: string; en: string }[];
  explanation: { hi: string; en: string };
  sources?: { label: string; url: string }[];
  correctIndex: number;
  date: string;
};

const bank: Omit<DailyQuestion, "date">[] = quizzes.flatMap((quiz) =>
  quiz.questions.map((question) => ({
    quizSlug: quiz.slug,
    questionId: question.id,
    prompt: question.prompt,
    options: question.options,
    explanation: question.explanation,
    sources: question.sources,
    correctIndex: question.correctIndex,
  })),
);

/** Daily rotation uses the IST calendar date and the verified local question bank. */
function todayKey(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function dailyQuestion(): DailyQuestion {
  const date = todayKey();
  let hash = 0;
  for (const char of date) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  // Rotate so consecutive days do not repeat the same question.
  const index = hash % bank.length;
  return { ...bank[index]!, date };
}

export async function GET() {
  const question = dailyQuestion();
  return noStore({
    ok: true,
    date: question.date,
    quizSlug: question.quizSlug,
    question: {
      id: question.questionId,
      prompt: question.prompt,
      options: question.options,
    },
    totalQuestions: bank.length,
    source: "Verified local question bank (see /sources)",
  });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`daily-quiz:${clientIp(request)}`, 40, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = dailyAnswerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const question = dailyQuestion();
  if (parsed.data.questionId !== question.questionId) {
    return NextResponse.json({ ok: false, error: "This is not today's question." }, { status: 409 });
  }
  if (parsed.data.optionIndex >= question.options.length) {
    return NextResponse.json({ ok: false, error: "Invalid option." }, { status: 400 });
  }

  const correct = parsed.data.optionIndex === question.correctIndex;
  return noStore({
    ok: true,
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    sources: question.sources ?? [],
    quizSlug: question.quizSlug,
  });
}
