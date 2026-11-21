import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { publishScheduledNews } from "@/lib/news-service";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Publish scheduled articles. Safe to call as often as the deployment plan
 * allows (idempotent). Public and admin news requests also run this lazily, so
 * publishing never depends on a browser tab or a single cron tick.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret) {
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured. Refusing to run scheduled publishing." },
      { status: 503 },
    );
  }

  const repo = await getRepository();
  const published = await publishScheduledNews(repo);
  return noStore({ ok: true, published, at: new Date().toISOString() });
}

export const POST = GET;
