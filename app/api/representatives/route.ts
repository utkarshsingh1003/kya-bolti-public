import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get("stateId") ?? undefined;
  const districtId = url.searchParams.get("districtId") ?? undefined;
  const repo = await getRepository();
  const reps = await repo.listRepresentatives({ stateId, districtId });
  return noStore({
    ok: true,
    representatives: reps.map((rep) => ({
      id: rep.id,
      name: rep.name,
      role: rep.role,
      constituency: rep.constituency,
      districtId: rep.districtId,
      stateId: rep.stateId,
      party: rep.party,
      officialContact: rep.officialContact,
      officialSourceUrl: rep.officialSourceUrl,
      verificationStatus: rep.verificationStatus,
      lastVerifiedAt: rep.lastVerifiedAt,
    })),
    storage: repo.mode,
  });
}
