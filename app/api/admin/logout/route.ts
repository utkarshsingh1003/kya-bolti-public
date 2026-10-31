import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = clearAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(session);
  return response;
}
