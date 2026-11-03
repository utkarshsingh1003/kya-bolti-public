import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { quizIcons } from "@/components/icons";
import { quizzes } from "@/data/quizzes";
import { pick } from "@/lib/i18n";
import { GamesExplorer } from "@/components/games-explorer";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "नागरिक ज्ञान के खेल",
  description: "संविधान, योजनाएँ, जनप्रतिनिधियों की भूमिकाएँ और मिथक-तथ्य — मुफ़्त, राजनीति-तटस्थ नागरिक क्विज़।",
  alternates: { canonical: "/games" },
};

const colorClass = {
  saffron: "bg-brand-100 text-brand-700",
  navy: "bg-navy-100 text-navy-700",
  teal: "bg-teal-100 text-teal-700",
  gold: "bg-gold-100 text-amber-800",
} as const;

export default async function GamesPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader
        eyebrow={text("खेल-खेल में सीखें", "Learn while you play")}
        title={text("नागरिक ज्ञान के खेल", "Civic knowledge games")}
        description={text(
          `${quizzes.length} छोटे क्विज़ — संविधान, सरकारी योजनाएँ, जनप्रतिनिधियों की भूमिकाएँ, मतदाता जागरूकता और मिथक-तथ्य। हर जवाब के साथ सरल व्याख्या और आधिकारिक स्रोत।`,
          `${quizzes.length} short quizzes — the Constitution, government schemes, the roles of representatives, voter awareness and myth vs fact. Every answer comes with a simple explanation and an official source.`,
        )}
      />
      <GamesExplorer />
      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const Icon = quizIcons[quiz.icon as keyof typeof quizIcons] ?? quizIcons.book;
            return (
              <Link
                key={quiz.slug}
                href={`/games/${quiz.slug}`}
                className="group flex flex-col rounded-2xl border border-navy-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass[quiz.color as keyof typeof colorClass] ?? colorClass.saffron}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="hindi mt-3 text-[1.05rem] font-extrabold leading-snug text-navy-900 group-hover:text-brand-800">
                  {pick(quiz.title, locale)}
                </h2>
                <p className="mt-1 flex-1 text-[0.8rem] leading-relaxed text-navy-600">{pick(quiz.description, locale)}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone="neutral">
                    {quiz.questions.length} {locale === "hi" ? "सवाल" : "questions"}
                  </Badge>
                  <span className="ml-auto text-[0.72rem] font-bold text-brand-700">
                    {locale === "hi" ? "खेलें →" : "Play →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 rounded-xl border border-navy-100 bg-white px-4 py-3 text-[0.72rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "क्विज़ राजनीति-तटस्थ हैं और किसी पार्टी या उम्मीदवार का समर्थन नहीं करते। स्कोर केवल सीखने के लिए हैं।"
            : "The quizzes are politically neutral and do not endorse any party or candidate. Scores are for learning only."}
        </p>
      </div>
    </>
  );
}
