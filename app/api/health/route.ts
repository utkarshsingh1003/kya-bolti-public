import { getRepository } from "@/lib/store";
import { noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  let storage = process.env.DATABASE_URL ? "postgres" : "file";
  let databaseOk = false;
  try {
    const repo = await getRepository();
    storage = repo.mode;
    await repo.getStats();
    databaseOk = true;
  } catch {
    databaseOk = false;
  }
  return noStore({
    ok: databaseOk,
    service: "kya-bolti-public",
    storage,
    persistent: storage === "postgres" || storage === "file",
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET),
    cronConfigured: Boolean(process.env.CRON_SECRET),
    timestamp: new Date().toISOString(),
  });
}

export const runtime = "nodejs";
