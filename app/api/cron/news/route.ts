import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshNews } from "@/lib/news";
import { clientIp, rateLimit } from "@/lib/security";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret) {
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured. Refusing to run feed refresh." },
      { status: 503 },
    );
  } else {
    const limit = rateLimit(`cron:${clientIp(request)}`, 10, 60_000);
    if (!limit.ok) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const result = await refreshNews();
  return noStore({
    ok: result.errors.length === 0,
    sources: result.sources,
    articles: result.articles.length,
    errors: result.errors,
    fetchedAt: new Date().toISOString(),
  });
}

export const POST = GET;
