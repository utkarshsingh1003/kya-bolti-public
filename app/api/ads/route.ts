import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { mutationGuard, noStore, readJson, validationError } from "@/lib/api";
import { adInquirySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = mutationGuard(request, { name: "ad-inquiry", limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (guard) return guard;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = adInquirySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.campaignStart && parsed.data.campaignEnd) {
    if (new Date(parsed.data.campaignEnd).getTime() < new Date(parsed.data.campaignStart).getTime()) {
      return NextResponse.json({ ok: false, error: "Campaign end date must be after the start date." }, { status: 400 });
    }
  }

  const repo = await getRepository();
  const inquiry = await repo.createAdInquiry({
    advertiserName: parsed.data.advertiserName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    objective: parsed.data.objective,
    budgetRange: parsed.data.budgetRange,
    placement: parsed.data.placement,
    destinationUrl: parsed.data.destinationUrl,
    creativeUrl: parsed.data.creativeUrl || undefined,
    campaignStart: parsed.data.campaignStart,
    campaignEnd: parsed.data.campaignEnd,
  });
  return noStore({ ok: true, id: inquiry.id, status: inquiry.status, paymentStatus: inquiry.paymentStatus }, { status: 201 });
}
