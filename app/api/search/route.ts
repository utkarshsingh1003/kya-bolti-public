import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { noStore } from "@/lib/api";
import { searchAll } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") === "en" ? "en" : "hi";
  if (query.trim().length > 120) {
    return NextResponse.json({ ok: false, error: "Search query is too long." }, { status: 400 });
  }
  const result = await searchAll(query, locale);
  return noStore({ ok: true, ...result });
}
