#!/usr/bin/env node
/**
 * Provision the least-privilege application role on the staging database.
 *
 * This is intentionally not a migration: the role owns a password and must
 * never be written to migration history. Grants and RLS policies for the role
 * live in `db/migrations/008_app_role_rls.sql`.
 *
 * Safety properties:
 *  - Refuses to run unless KBP_STAGING_PROJECT_REF matches the target URL.
 *  - Refuses the known production project ref outright.
 *  - Never prints the password or the connection string.
 *  - The role is NOBYPASSRLS, NOSUPERUSER, NOCREATEDB, NOCREATEROLE.
 *
 * Usage:
 *   MIGRATION_DATABASE_URL=postgres://... \
 *   KBP_STAGING_PROJECT_REF=<ref> \
 *   KBP_APP_ROLE_PASSWORD=<generated> \
 *   node scripts/provision-app-role.mjs
 */
import process from "node:process";
import pg from "pg";
import { postgresPoolOptions } from "../lib/postgres-config.ts";
import { supabaseProjectRef } from "./migrate-lib.ts";

const { Client } = pg;
const ROLE = "kbp_app";
const KNOWN_PRODUCTION_REF = process.env.KBP_PRODUCTION_PROJECT_REF ?? "lgondshzwhbpreumejvp";

function fail(message) {
  console.error(`provision-app-role: ${message}`);
  process.exit(1);
}

const adminUrl = process.env.MIGRATION_DATABASE_URL?.trim();
if (!adminUrl) fail("MIGRATION_DATABASE_URL is required.");
const expectedRef = process.env.KBP_STAGING_PROJECT_REF?.trim();
if (!expectedRef) fail("KBP_STAGING_PROJECT_REF is required; refusing to guess the target.");
const password = process.env.KBP_APP_ROLE_PASSWORD;
if (!password || password.length < 24) {
  fail("KBP_APP_ROLE_PASSWORD must be supplied (24+ characters).");
}

const actualRef = supabaseProjectRef(adminUrl);
if (actualRef !== expectedRef) {
  fail("connection project ref does not match KBP_STAGING_PROJECT_REF.");
}
if (actualRef === KNOWN_PRODUCTION_REF) {
  fail("refusing to provision the application role on the production project.");
}

const client = new Client(
  postgresPoolOptions(adminUrl, {
    options: "-c statement_timeout=30000 -c lock_timeout=10000",
  }),
);

try {
  await client.connect();
  const who = (await client.query("select current_user, session_user")).rows[0];
  if (who.current_user === "anon" || who.current_user === "authenticated") {
    fail(`connected as ${who.current_user}; refusing to provision roles.`);
  }

  await client.query("begin");
  const exists = (
    await client.query("select 1 from pg_roles where rolname = $1", [ROLE])
  ).rowCount;

  if (exists) {
    await client.query(
      `alter role ${ROLE} with login password ${quoteLiteral(password)}
         nosuperuser nocreatedb nocreaterole noreplication nobypassrls`,
    );
  } else {
    await client.query(
      `create role ${ROLE} with login password ${quoteLiteral(password)}
         nosuperuser nocreatedb nocreaterole noreplication nobypassrls
         connection limit 20`,
    );
  }
  await client.query("commit");

  const attrs = (
    await client.query(
      `select rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolcanlogin
         from pg_roles where rolname = $1`,
      [ROLE],
    )
  ).rows[0];

  if (!attrs || !attrs.rolcanlogin) fail("role was not created with LOGIN.");
  if (attrs.rolsuper || attrs.rolbypassrls || attrs.rolcreatedb || attrs.rolcreaterole) {
    fail("role has elevated attributes; refusing to continue.");
  }

  console.log(
    `provision-app-role: ${ROLE} ready (${exists ? "updated" : "created"}) ` +
      "| superuser=false bypassrls=false createdb=false createrole=false login=true",
  );
} catch (error) {
  await client.query("rollback").catch(() => {});
  fail(error instanceof Error ? error.message : "unknown error");
} finally {
  await client.end().catch(() => {});
}

function quoteLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
