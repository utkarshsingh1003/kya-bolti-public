#!/usr/bin/env node
/**
 * Minimal Postgres migration runner. Applies db/migrations/*.sql inside a
 * transaction and records applied files in schema_migrations.
 *
 * Usage: DATABASE_URL=postgres://... npm run db:migrate
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Nothing to do.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
});

const dir = path.join(process.cwd(), "db", "migrations");

try {
  await pool.query(`create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )`);

  const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  const applied = new Set(
    (await pool.query("select filename from schema_migrations")).rows.map((row) => row.filename),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await fs.readFile(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [file]);
      await client.query("commit");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  console.log("migrations complete");
} catch (error) {
  console.error("migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
