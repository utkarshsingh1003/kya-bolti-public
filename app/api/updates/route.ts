import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = await getRepository();
  const updates = await repo.listAnnouncements(true);
  return noStore({ ok: true, updates, storage: repo.mode });
}
