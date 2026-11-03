import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { buzzLinkSchema, looksLikeAbuse, looksLikeSpam } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = await getRepository();
  const posts = await repo.listBuzzPosts(true);
  return noStore({
    ok: true,
    posts: posts.filter((post) => post.origin === "admin"),
    communitySubmissions: posts.filter((post) => post.origin === "community_link").length,
  });
}

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "buzz-link", limit: 5, windowMs: 24 * 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = buzzLinkSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (looksLikeAbuse(parsed.data.title) || looksLikeAbuse(parsed.data.note ?? "")) {
    return NextResponse.json({ ok: false, error: "This submission contains abusive language." }, { status: 422 });
  }
  if (looksLikeSpam(parsed.data.note ?? "")) {
    return NextResponse.json({ ok: false, error: "This looks like spam." }, { status: 422 });
  }

  const repo = await getRepository();
  const post = await repo.createBuzzPost({
    title: { hi: parsed.data.title, en: parsed.data.title },
    summary: {
      hi: parsed.data.note || "सुझाया गया स्रोत — संपादकीय समीक्षा बाकी है।",
      en: parsed.data.note || "Suggested source — editorial review pending.",
    },
    body: { hi: "", en: "" },
    category: parsed.data.category,
    platform: parsed.data.platform,
    sourceUrl: parsed.data.sourceUrl,
    imageUrl: null,
    status: "pending",
    origin: "community_link",
    submittedBy: null,
  });
  return noStore({ ok: true, id: post.id }, { status: 201 });
}
