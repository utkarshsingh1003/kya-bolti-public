import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, ButtonLink, DemoBadge } from "@/components/ui";
import { ShareButtons } from "@/components/share-buttons";
import { quizzes } from "@/data/quizzes";
import { getRepository } from "@/lib/store";
import { pick } from "@/lib/i18n";

type ShareData = {
  title: string;
  description: string;
  eyebrow: string;
  isDemo: boolean;
  meta?: string;
  href: string;
  kind: "poll" | "quiz" | "issue" | "thread";
};

async function loadShare(type: string, id: string): Promise<ShareData | null> {
  if (type === "quiz") {
    const quiz = quizzes.find((item) => item.slug === id);
    if (!quiz) return null;
    return {
      title: pick(quiz.title, "hi"),
      description: pick(quiz.description, "hi"),
      eyebrow: "नागरिक क्विज़",
      isDemo: false,
      meta: `${quiz.questions.length} सवाल`,
      href: `/games/${quiz.slug}`,
      kind: "quiz",
    };
  }
  const repo = await getRepository();
  if (type === "poll") {
    const poll = await repo.getPoll(id);
    if (!poll) return null;
    return {
      title: pick(poll.question, "hi"),
      description: pick(poll.description, "hi"),
      eyebrow: "सामुदायिक पोल",
      isDemo: poll.isDemo,
      href: "/polls",
      kind: "poll",
    };
  }
  if (type === "issue") {
    const issues = await repo.listIssues({ limit: 200 });
    const issue = issues.find((item) => item.id === id || item.trackingCode === id.toUpperCase());
    if (!issue) return null;
    return {
      title: issue.title,
      description: issue.description,
      eyebrow: "नागरिक समस्या",
      isDemo: issue.isDemo,
      meta: issue.trackingCode,
      href: `/issues?code=${encodeURIComponent(issue.trackingCode)}`,
      kind: "issue",
    };
  }
  if (type === "thread") {
    const result = await repo.getThread(id);
    if (!result) return null;
    return {
      title: result.thread.title,
      description: result.thread.body,
      eyebrow: "मोहल्ला चर्चा",
      isDemo: result.thread.isDemo,
      meta: `${result.thread.replyCount} जवाब`,
      href: `/discussions/${result.thread.id}`,
      kind: "thread",
    };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }): Promise<Metadata> {
  const { type, id } = await params;
  const data = await loadShare(type, id);
  if (!data) return { title: "साझा कार्ड नहीं मिला" };
  return {
    title: data.title,
    description: data.description.slice(0, 160),
    openGraph: { title: data.title, description: data.description.slice(0, 200), type: "article" },
    twitter: { card: "summary", title: data.title, description: data.description.slice(0, 200) },
  };
}

export default async function SharePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const data = await loadShare(type, id);
  if (!data) notFound();
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-2xl border border-navy-100 bg-white p-6 shadow-float sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{data.eyebrow}</Badge>
          {data.isDemo ? <DemoBadge /> : null}
          {data.meta ? <span className="ml-auto text-[0.68rem] font-mono font-bold text-navy-500">{data.meta}</span> : null}
        </div>
        <h1 className="hindi mt-3 text-balance text-2xl font-extrabold leading-tight text-navy-900">{data.title}</h1>
        <p className="mt-2 line-clamp-4 text-[0.85rem] leading-relaxed text-navy-600">{data.description}</p>
        <div className="mt-5">
          <ShareButtons title={data.title} />
        </div>
        <div className="mt-5 border-t border-navy-100 pt-4">
          <ButtonLink href={data.href} className="w-full">
            {data.kind === "quiz"
              ? "क्विज़ खेलें"
              : data.kind === "poll"
                ? "पोल में वोट दें"
                : data.kind === "issue"
                  ? "समस्या की स्थिति देखें"
                  : "चर्चा पढ़ें"}
          </ButtonLink>
          <Link href={data.href} className="mt-2 block text-center text-[0.7rem] font-semibold text-navy-500 hover:underline">
            क्या बोलती PUBLIC पर देखें
          </Link>
        </div>
        <p className="mt-4 text-center text-[0.65rem] leading-relaxed text-navy-400">
          यह लिंक किसी व्यक्ति की निजी जानकारी साझा नहीं करता। डेमो सामग्री स्पष्ट रूप से चिह्नित है।
        </p>
      </div>
    </div>
  );
}
