import type { Quiz } from "@/lib/types";

/** Count correct answers. Unanswered questions (null) never score. */
export function scoreQuiz(quiz: Quiz, answers: (number | null)[]): number {
  return quiz.questions.reduce(
    (score, question, index) => (answers[index] === question.correctIndex ? score + 1 : score),
    0,
  );
}

/** Percentage rounded to the nearest whole number; 0 for an empty quiz. */
export function quizPercent(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}
