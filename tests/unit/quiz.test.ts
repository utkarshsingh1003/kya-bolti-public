import { describe, expect, it } from "vitest";
import { getQuiz, quizzes } from "@/data/quizzes";
import { quizPercent, scoreQuiz } from "@/lib/quiz";

describe("quiz dataset", () => {
  it("ships the expected number of quizzes with complete metadata", () => {
    expect(quizzes).toHaveLength(8);
    const slugs = quizzes.map((quiz) => quiz.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const quiz of quizzes) {
      expect(quiz.slug).toMatch(/^[a-z0-9-]+$/);
      expect(quiz.title.hi.length).toBeGreaterThan(3);
      expect(quiz.title.en.length).toBeGreaterThan(3);
      expect(quiz.description.hi.length).toBeGreaterThan(10);
      expect(quiz.description.en.length).toBeGreaterThan(10);
      expect(quiz.questions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives every question a valid answer, explanation and official source", () => {
    const ids = new Set<string>();
    for (const quiz of quizzes) {
      for (const question of quiz.questions) {
        expect(ids.has(question.id)).toBe(false);
        ids.add(question.id);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(question.correctIndex)).toBe(true);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
        expect(question.prompt.hi.length).toBeGreaterThan(5);
        expect(question.prompt.en.length).toBeGreaterThan(5);
        expect(question.explanation.hi.length).toBeGreaterThan(10);
        expect(question.explanation.en.length).toBeGreaterThan(10);
        expect(question.sources?.length).toBeGreaterThan(0);
        for (const source of question.sources ?? []) {
          expect(source.label.length).toBeGreaterThan(2);
          expect(source.url.startsWith("https://")).toBe(true);
        }
      }
    }
  });

  it("resolves quizzes by slug", () => {
    expect(getQuiz("constitution")?.title.en).toBe("Know Your Constitution");
    expect(getQuiz("missing")).toBeUndefined();
  });
});

describe("scoreQuiz", () => {
  it("scores all-correct, all-wrong, partial and unanswered attempts", () => {
    for (const quiz of quizzes) {
      const correct = quiz.questions.map((question) => question.correctIndex);
      expect(scoreQuiz(quiz, correct)).toBe(quiz.questions.length);

      const wrong = quiz.questions.map(
        (question) => (question.correctIndex + 1) % question.options.length,
      );
      expect(scoreQuiz(quiz, wrong)).toBe(0);

      const partial = quiz.questions.map((question, index) =>
        index < 2 ? question.correctIndex : null,
      );
      expect(scoreQuiz(quiz, partial)).toBe(2);
      expect(scoreQuiz(quiz, quiz.questions.map(() => null))).toBe(0);
    }
  });

  it("ignores out-of-range answers and computes rounded percentages", () => {
    const quiz = quizzes[0]!;
    expect(scoreQuiz(quiz, quiz.questions.map(() => 99))).toBe(0);
    expect(quizPercent(3, 4)).toBe(75);
    expect(quizPercent(1, 3)).toBe(33);
    expect(quizPercent(0, 0)).toBe(0);
  });
});
