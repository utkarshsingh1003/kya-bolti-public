import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  path.join(root, "db/migrations/007_reconcile_production_schema.sql"),
  "utf8",
);
const runner = readFileSync(path.join(root, "scripts/migrate.mjs"), "utf8");

describe("migration 007 safety", () => {
  it("is forward-only: no drops, truncates or row rewrites", () => {
    expect(migration).not.toMatch(/^\s*drop\s+(table|column)/im);
    expect(migration).not.toMatch(/^\s*truncate/im);
    expect(migration).not.toMatch(/^\s*delete\s+from/im);
    expect(migration).not.toMatch(/^\s*update\s+\w+\s+set/im);
  });

  it("does not manage transactions or run concurrently (runner owns the transaction)", () => {
    expect(migration).not.toMatch(/^\s*(commit|rollback)\s*;/im);
    expect(migration).not.toMatch(/create\s+(unique\s+)?index\s+concurrently/i);
    expect(migration).not.toMatch(/^\s*(vacuum|reindex)/im);

    // Runner contract: one transaction per file, rollback on any failure.
    expect(runner).toMatch(/await client\.query\("begin"\)/);
    expect(runner).toMatch(/await client\.query\("commit"\)/);
    expect(runner).toMatch(/await client\.query\("rollback"\)/);
  });

  it("never drops or recreates primary keys", () => {
    expect(migration).not.toMatch(/drop\s+constraint[^;]*primary/i);
    expect(migration).not.toMatch(/add\s+constraint[^;]*_pkey/i);
    expect(migration).not.toMatch(/drop\s+index[^;]*_pkey/i);
  });

  it("creates missing tables idempotently", () => {
    expect(migration).toMatch(/create table if not exists reports/i);
    expect(migration).toMatch(/create table if not exists replies/i);
  });

  it("adds every missing column behind ADD COLUMN IF NOT EXISTS", () => {
    const definitions = migration.match(/^\s{6}\('[a-z_]+', '[a-z_]+', \$def\$/gm) ?? [];
    expect(definitions.length).toBeGreaterThanOrEqual(75);
    expect(migration).toMatch(/add column if not exists %I %s/i);
  });

  it("validates type conversions before/while casting", () => {
    expect(migration).toMatch(/options_hi::jsonb/);
    expect(migration).toMatch(/options_en::jsonb/);
    expect(migration).toMatch(/not valid JSON/);
    expect(migration).toMatch(/quiz_scores\.id conversion requires empty table/);
    expect(migration).toMatch(/moderation_actions\.id conversion requires empty table/);
    expect(migration).toMatch(/using id::text/);
    expect(migration).toMatch(/using id::bigint/);
  });

  it("refuses NOT NULL columns without defaults on populated tables", () => {
    expect(migration).toMatch(/NOT NULL without default to a table with % row\(s\)/);
    expect(migration).toMatch(/password_hash has % null row\(s\)/);
  });

  it("relaxes only the legacy NOT NULL insert blockers", () => {
    for (const [table, column] of [
      ["questions", "title"],
      ["questions", "content"],
      ["reviews", "content"],
      ["threads", "content"],
      ["news_sources", "url"],
      ["moderation_actions", "action_type"],
    ]) {
      expect(migration).toContain(`('${table}', '${column}')`);
    }
    expect(migration).toMatch(/drop not null/);
  });

  it("adds constraints as NOT VALID and validates only when clean", () => {
    expect(migration).toMatch(/reviews_rating_check check \(rating between 1 and 5\) not valid/);
    expect(migration).toMatch(/quiz_scores_score_check check \(score >= 0\) not valid/);
    expect(migration).toMatch(/quiz_scores_check check \(total > 0 and score <= total\) not valid/);
    expect(migration).toMatch(/refusing to validate constraint/);
    expect(migration).toMatch(/orphaned owner_id row/);
    expect(migration).toMatch(/orphaned replies\.thread_id/);
  });

  it("creates the canonical index set idempotently", () => {
    expect((migration.match(/create index if not exists/g) ?? []).length).toBe(17);
  });

  it("keeps RLS policy creation idempotent and deny-by-default for anon", () => {
    expect(migration).toMatch(/enable row level security/);
    expect(migration).toMatch(/_anon_deny/);
    expect(migration).toMatch(/_service_all/);
    expect(migration).toMatch(/pg_policies/);
    expect(migration).toMatch(/revoke all on table public\.schema_migrations from anon/);
    expect(migration).not.toMatch(/force\s+row\s+level\s+security\s*;/i);
  });
});
