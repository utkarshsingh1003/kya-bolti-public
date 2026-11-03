import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.join(process.cwd(), "db", "migrations");

function readMigration(filename: string) {
  return readFileSync(path.join(migrationsDir, filename), "utf8");
}

describe("schema migrations", () => {
  it("ships an ordered repair for missing polls and issues.pin", () => {
    const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
    expect(files).toEqual([
      "001_init.sql",
      "002_content_and_accounts.sql",
      "003_repair_polls_and_issues_pin.sql",
    ]);

    const init = readMigration("001_init.sql");
    const content = readMigration("002_content_and_accounts.sql");
    const repair = readMigration("003_repair_polls_and_issues_pin.sql");

    expect(init).toMatch(/alter table issues add column if not exists pin text/i);
    expect(content).toMatch(/create table if not exists polls \(/i);
    expect(content.indexOf("create table if not exists polls")).toBeLessThan(
      content.indexOf("alter table polls add column if not exists status"),
    );
    expect(content).toMatch(/alter table issues add column if not exists pin text/i);

    expect(repair).toMatch(/create table if not exists polls \(/i);
    expect(repair).toMatch(/create table if not exists poll_options \(/i);
    expect(repair).toMatch(/create table if not exists poll_votes \(/i);
    expect(repair).toMatch(/alter table issues add column if not exists pin text/i);
    expect(repair).not.toMatch(/^\s*drop table/im);
    expect(repair).not.toMatch(/^\s*truncate/im);
  });
});
