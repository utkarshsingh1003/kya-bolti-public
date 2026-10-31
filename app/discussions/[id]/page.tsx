import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThreadDetail } from "@/components/thread-detail";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const repo = await getRepository();
  const result = await repo.getThread(id);
  if (!result) return { title: "चर्चा नहीं मिली" };
  return {
    title: result.thread.title,
    description: result.thread.body.slice(0, 160),
    alternates: { canonical: `/discussions/${id}` },
  };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepository();
  const result = await repo.getThread(id);
  if (!result) notFound();
  return <ThreadDetail thread={result.thread} initialReplies={result.replies} />;
}
