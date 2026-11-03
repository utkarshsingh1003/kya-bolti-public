import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore, readJson, validationError } from "@/lib/api";
import { requireAdmin } from "@/lib/security";
import { adManageSchema } from "@/lib/validation";
import type { AdInquiry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const repo = await getRepository();
  return noStore({ ok: true, inquiries: await repo.listAdInquiries() });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const parsed = adManageSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const repo = await getRepository();
  const inquiries = await repo.listAdInquiries();
  const current = inquiries.find((item) => item.id === parsed.data.id);
  if (!current) return NextResponse.json({ ok: false, error: "Inquiry not found." }, { status: 404 });

  const statusMap: Record<string, AdInquiry["status"]> = {
    approve: "approved",
    reject: "rejected",
    activate: "active",
    pause: "paused",
    resume: "active",
    expire: "expired",
  };
  if (parsed.data.action === "delete") {
    // Ads are financial records; deletion is intentionally unsupported.
    return NextResponse.json(
      { ok: false, error: "Advertising inquiries are retained for records. Reject or expire them instead." },
      { status: 400 },
    );
  }
  if (parsed.data.action === "activate" && current.paymentStatus !== "verified") {
    return NextResponse.json(
      { ok: false, error: "Payment must be manually verified before a campaign can be activated." },
      { status: 409 },
    );
  }
  if (parsed.data.action === "verify_payment") {
    const updated = await repo.updateAdInquiry(current.id, {
      paymentStatus: "verified",
      adminNote: parsed.data.note || current.adminNote,
    });
    return noStore({ ok: true, inquiry: updated });
  }

  const updated = await repo.updateAdInquiry(current.id, {
    status: statusMap[parsed.data.action] ?? current.status,
    adminNote: parsed.data.note || current.adminNote,
  });
  return noStore({ ok: true, inquiry: updated });
}
