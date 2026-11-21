import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  path.join(root, "db/migrations/008_app_role_rls.sql"),
  "utf8",
);
const provisioner = readFileSync(
  path.join(root, "scripts/provision-app-role.mjs"),
  "utf8",
);

describe("migration 008 least-privilege role", () => {
  it("is a no-op when the application role does not exist", () => {
    expect(migration).toMatch(/if not exists \(select 1 from pg_roles where rolname = app_role\)/);
    expect(migration).toMatch(/return;/);
  });

  it("grants only DML on public tables and sequences", () => {
    expect(migration).toMatch(/revoke all on all tables in schema public/);
    expect(migration).toMatch(/grant select, insert, update, delete on all tables/);
    expect(migration).toMatch(/grant usage, select on all sequences/);
    expect(migration).toMatch(/grant usage on schema public/);
    expect(migration).not.toMatch(/grant (all|create|truncate|references|trigger)/i);
    expect(migration).not.toMatch(/with grant option/i);
  });

  it("keeps migration metadata and grants configuration out of the app role", () => {
    expect(migration).toMatch(/revoke all on table public\.schema_migrations/);
    expect(migration).not.toMatch(/grant[^;]*schema_migrations to/i);
  });

  it("adds one permissive RLS policy per application table for the app role only", () => {
    expect(migration).toMatch(/policyname = tbl \|\| '_kbp_app_allow'/);
    expect(migration).toMatch(/for all to %I using \(true\) with check \(true\)/);
    expect(migration).toMatch(/enable row level security/);
    expect(migration).toMatch(/'polls', 'poll_options', 'poll_votes'/);
    expect(migration).toMatch(/'news_sources', 'moderation_actions'/);
    expect(migration).not.toMatch(/force row level security/i);
    expect(migration).not.toMatch(/to anon using/i);
  });
});

describe("application role provisioner", () => {
  it("refuses to run without an explicit staging ref", () => {
    expect(provisioner).toMatch(/KBP_STAGING_PROJECT_REF is required/);
    expect(provisioner).toMatch(/actualRef !== expectedRef/);
  });

  it("refuses the production project and elevated attributes", () => {
    expect(provisioner).toMatch(/refusing to provision the application role on the production project/);
    expect(provisioner).toMatch(/nosuperuser nocreatedb nocreaterole noreplication nobypassrls/);
    expect(provisioner).toMatch(/role has elevated attributes/);
  });

  it("never logs the password or connection string", () => {
    expect(provisioner).not.toMatch(/console\.log\([^)]*password/i);
    expect(provisioner).not.toMatch(/console\.log\([^)]*adminUrl/i);
  });
});
