import fs from "node:fs";
import path from "node:path";
import type { PoolConfig } from "pg";

const SUPABASE_HOST = /(?:^|\.)supabase\.(?:co|com)$/i;

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function parseEnvFile(contents: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;
    env[key] = stripWrappingQuotes(trimmed.slice(eq + 1));
  }
  return env;
}

/** Load `.env.local` then `.env` without overriding variables already in the process. */
export function applyLocalDatabaseEnv(cwd = process.cwd()): void {
  for (const filename of [".env.local", ".env"]) {
    const file = path.join(cwd, filename);
    if (!fs.existsSync(file)) continue;
    const parsed = parseEnvFile(fs.readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sslConfig(hostname: string, sslmode: string | null): PoolConfig["ssl"] {
  const mode = (sslmode || "").toLowerCase();
  if (mode === "disable") return undefined;
  const supabase = SUPABASE_HOST.test(hostname);
  const wantsSsl = supabase || mode === "require" || mode === "no-verify" || mode === "verify-ca" || mode === "verify-full";
  if (!wantsSsl) return undefined;
  // Supabase pooler and some local CA stores present a chain Node rejects when
  // rejectUnauthorized is true. Direct URLs also omit sslmode; SSL is still required.
  const verify = mode === "verify-ca" || mode === "verify-full" || (mode === "require" && !supabase);
  return { rejectUnauthorized: verify };
}

/**
 * Build node-postgres options from a URL.
 * Discrete user/password/host fields avoid auth failures when the password
 * contains reserved URI characters and enable SSL for Supabase even without sslmode.
 */
export function postgresPoolOptions(connectionString: string, extra: PoolConfig = {}): PoolConfig {
  const raw = stripWrappingQuotes(connectionString);
  try {
    const url = new URL(raw);
    const database = decodeComponent((url.pathname || "/postgres").replace(/^\//, "") || "postgres");
    const sslmode = url.searchParams.get("sslmode");
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      user: decodeComponent(url.username),
      password: decodeComponent(url.password),
      database,
      ssl: sslConfig(url.hostname, sslmode),
      ...extra,
    };
  } catch {
    return {
      connectionString: raw,
      ssl: /sslmode=require/i.test(raw) || /supabase\.(co|com)/i.test(raw) ? { rejectUnauthorized: false } : undefined,
      ...extra,
    };
  }
}
