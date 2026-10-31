import { quizzes } from "@/data/quizzes";
import { getRepository } from "@/lib/store";
import { getNews } from "@/lib/news";
import { pick } from "@/lib/i18n";
import type { SearchResult, SearchResultType } from "@/lib/search-shared";
import type { Locale } from "@/lib/types";

export type { SearchResult, SearchResultType } from "@/lib/search-shared";

const pages = [
  { href: "/news", hi: "खबरें और नागरिक जानकारी", en: "News & civic information", dHi: "स्थानीय, राज्य और राष्ट्रीय खबरें, स्रोत के साथ।", dEn: "Local, state and national stories with sources." },
  { href: "/representatives", hi: "जनप्रतिनिधि को जानें", en: "Know your representatives", dHi: "सांसद, विधायक, पार्षद, महापौर और ग्राम प्रधान की भूमिकाएँ।", dEn: "Roles of MPs, MLAs, councillors, mayors and gram pradhans." },
  { href: "/issues", hi: "नागरिक समस्याएँ", en: "Civic issues", dHi: "सड़क, पानी, सफ़ाई, बिजली और स्ट्रीटलाइट की शिकायत दर्ज करें।", dEn: "Report roads, water, sanitation, electricity and streetlight problems." },
  { href: "/issues/new", hi: "समस्या दर्ज करें", en: "Report an issue", dHi: "नई समस्या दर्ज करें और ट्रैकिंग कोड पाएँ।", dEn: "Submit a new issue and get a tracking code." },
  { href: "/polls", hi: "सामुदायिक पोल", en: "Community polls", dHi: "गैर-आधिकारिक नागरिक पोल में अपनी राय दें।", dEn: "Vote in unofficial civic polls." },
  { href: "/games", hi: "नागरिक ज्ञान के खेल", en: "Civic knowledge games", dHi: "संविधान, योजनाएँ, भूमिकाएँ और मिथक-तथ्य क्विज़।", dEn: "Constitution, schemes, roles and myth-vs-fact quizzes." },
  { href: "/discussions", hi: "मोहल्ला चर्चा", en: "Neighbourhood discussions", dHi: "अपने इलाके के मुद्दों पर सभ्य चर्चा।", dEn: "Civil discussion about local issues." },
  { href: "/qa", hi: "नागरिक सवाल-जवाब", en: "Civic Q&A", dHi: "स्थानीय शासन और सरकारी सेवाओं के सवाल।", dEn: "Questions about local governance and public services." },
  { href: "/reviews", hi: "सेवा समीक्षा", en: "Service reviews", dHi: "सार्वजनिक सेवाओं पर नागरिक अनुभव।", dEn: "Citizen experiences with public services." },
  { href: "/assistant", hi: "जनता साथी", en: "Janata Saathi", dHi: "हिंदी में बोलकर या लिखकर सवाल पूछें।", dEn: "Ask by voice or text in Hindi." },
  { href: "/about", hi: "हमारे बारे में", en: "About", dHi: "मंच का उद्देश्य और स्वतंत्रता की घोषणा।", dEn: "The platform's purpose and independence." },
  { href: "/privacy", hi: "गोपनीयता नीति", en: "Privacy policy", dHi: "कौन-सा डेटा लिया जाता है और क्यों।", dEn: "What data is collected and why." },
  { href: "/terms", hi: "उपयोग की शर्तें", en: "Terms of use", dHi: "मंच के उपयोग के नियम।", dEn: "Rules for using the platform." },
  { href: "/guidelines", hi: "सामुदायिक दिशानिर्देश", en: "Community guidelines", dHi: "सुरक्षित और सभ्य भागीदारी के नियम।", dEn: "Rules for safe, civil participation." },
  { href: "/sources", hi: "स्रोत और श्रेय", en: "Sources & attribution", dHi: "समाचार और प्रतिनिधि डेटा के स्रोत।", dEn: "Sources for news and representative data." },
  { href: "/corrections", hi: "सुधार नीति", en: "Corrections policy", dHi: "गलती मिलने पर सुधार कैसे करें।", dEn: "How to report and correct errors." },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(haystack: string[], query: string): boolean {
  const normalized = normalize(query);
  if (!normalized) return false;
  return haystack.some((value) => normalize(value).includes(normalized));
}

export async function searchAll(rawQuery: string, locale: Locale): Promise<{
  query: string;
  groups: Record<SearchResultType, SearchResult[]>;
  total: number;
}> {
  const query = rawQuery.trim().slice(0, 120);
  const empty: Record<SearchResultType, SearchResult[]> = {
    news: [],
    page: [],
    representative: [],
    poll: [],
    quiz: [],
    issue: [],
    question: [],
  };
  if (query.length < 2) return { query, groups: empty, total: 0 };

  const repo = await getRepository();
  const [news, polls, issues, reps, questions] = await Promise.all([
    getNews(),
    repo.listPolls(),
    repo.listIssues({ limit: 100 }),
    repo.listRepresentatives(),
    repo.listQuestions({ limit: 100 }),
  ]);

  const groups: Record<SearchResultType, SearchResult[]> = {
    news: news.articles
      .filter((article) => matches([pick(article.title, "hi"), pick(article.title, "en"), pick(article.summary, "hi"), pick(article.summary, "en")], query))
      .slice(0, 6)
      .map((article) => ({
        type: "news",
        id: article.id,
        title: pick(article.title, locale),
        description: pick(article.summary, locale).slice(0, 160),
        href: article.sourceUrl ?? `/news#${article.id}`,
        meta: article.isDemo ? "Demo" : article.sourceName,
        external: Boolean(article.sourceUrl),
      })),
    page: pages
      .filter((page) => matches([page.hi, page.en, page.dHi, page.dEn], query))
      .slice(0, 6)
      .map((page) => ({
        type: "page",
        id: page.href,
        title: locale === "hi" ? page.hi : page.en,
        description: locale === "hi" ? page.dHi : page.dEn,
        href: page.href,
      })),
    representative: reps
      .filter((rep) => rep.name && matches([rep.name, rep.constituency ?? "", rep.role], query))
      .slice(0, 6)
      .map((rep) => ({
        type: "representative",
        id: rep.id,
        title: rep.name ?? "",
        description: `${rep.role.toUpperCase()} · ${rep.constituency ?? ""}`,
        href: `/representatives?district=${rep.districtId ?? ""}`,
        meta: "Verified",
      })),
    poll: polls
      .filter((poll) => matches([poll.question.hi, poll.question.en, poll.description.hi, poll.description.en], query))
      .slice(0, 6)
      .map((poll) => ({
        type: "poll",
        id: poll.id,
        title: pick(poll.question, locale),
        description: pick(poll.description, locale).slice(0, 160),
        href: "/polls",
        meta: poll.isDemo ? "Demo" : undefined,
      })),
    quiz: quizzes
      .filter((quiz) =>
        matches(
          [
            quiz.title.hi,
            quiz.title.en,
            quiz.description.hi,
            quiz.description.en,
            ...quiz.questions.flatMap((question) => [question.prompt.hi, question.prompt.en]),
          ],
          query,
        ),
      )
      .slice(0, 6)
      .map((quiz) => ({
        type: "quiz",
        id: quiz.slug,
        title: pick(quiz.title, locale),
        description: pick(quiz.description, locale),
        href: `/games/${quiz.slug}`,
        meta: `${quiz.questions.length} ${locale === "hi" ? "सवाल" : "questions"}`,
      })),
    issue: issues
      .filter((issue) => matches([issue.title, issue.description, issue.area], query))
      .slice(0, 6)
      .map((issue) => ({
        type: "issue",
        id: issue.id,
        title: issue.title,
        description: `${issue.area} · ${issue.trackingCode}`,
        href: `/issues?code=${encodeURIComponent(issue.trackingCode)}`,
        meta: issue.isDemo ? "Demo" : undefined,
      })),
    question: questions
      .filter((question) => matches([question.question, question.answer ?? ""], query))
      .slice(0, 6)
      .map((question) => ({
        type: "question",
        id: question.id,
        title: question.question,
        description: question.answer?.slice(0, 160) ?? (locale === "hi" ? "जवाब की प्रतीक्षा" : "Awaiting an answer"),
        href: "/qa",
      })),
  };

  const total = Object.values(groups).reduce((sum, group) => sum + group.length, 0);
  return { query, groups, total };
}

export { searchSuggestions } from "@/lib/search-shared";
