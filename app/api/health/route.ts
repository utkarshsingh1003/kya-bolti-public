import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  let storage = process.env.DATABASE_URL ? "postgres" : "file";
  let databaseOk = false;
  let error: string | null = null;
  try {
    const repo = await getRepository();
    storage = repo.mode;
    await repo.getStats();
    databaseOk = true;
  } catch (caught) {
    databaseOk = false;
    error = caught instanceof Error ? caught.message : "Unknown storage error.";
  }
  const persistent = storage === "postgres" || storage === "file";
  return noStore({
    ok: databaseOk,
    service: "kya-bolti-public",
    storage,
    persistent,
    databaseError: databaseOk ? null : error,
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET),
    cronConfigured: Boolean(process.env.CRON_SECRET),
    timestamp: new Date().toISOString(),
  });
}

export const runtime = "nodejs";
