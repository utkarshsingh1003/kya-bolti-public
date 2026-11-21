import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { newsAutomationSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, settings: await repo.getNewsAutomationSettings() });
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = newsAutomationSettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const repo = await getRepository();
  const settings = await repo.updateNewsAutomationSettings(parsed.data);
  return noStore({ ok: true, settings });
}
