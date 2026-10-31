import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz-runner";
import { quizzes } from "@/data/quizzes";
import { pick } from "@/lib/i18n";

export function generateStaticParams() {
  return quizzes.map((quiz) => ({ slug: quiz.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const quiz = quizzes.find((item) => item.slug === slug);
  if (!quiz) return { title: "खेल नहीं मिला" };
  return {
    title: pick(quiz.title, "hi"),
    description: pick(quiz.description, "hi"),
    alternates: { canonical: `/games/${quiz.slug}` },
  };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = quizzes.find((item) => item.slug === slug);
  if (!quiz) notFound();
  return <QuizRunner quiz={quiz} />;
}
