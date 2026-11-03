import { describe, expect, it } from "vitest";
import { parseEnvFile, postgresPoolOptions } from "@/lib/postgres-config";

describe("postgresPoolOptions", () => {
  it("enables SSL for Supabase URLs that omit sslmode", () => {
    const options = postgresPoolOptions(
      "postgresql://postgres:secret@db.abc123.supabase.co:5432/postgres",
    );
    expect(options.host).toBe("db.abc123.supabase.co");
    expect(options.port).toBe(5432);
    expect(options.user).toBe("postgres");
    expect(options.password).toBe("secret");
    expect(options.database).toBe("postgres");
    expect(options.ssl).toEqual({ rejectUnauthorized: false });
    expect(options.connectionString).toBeUndefined();
  });

  it("passes reserved password characters as a discrete field", () => {
    const password = "p@ss:w/rd#1";
    const encoded = encodeURIComponent(password);
    const options = postgresPoolOptions(
      `postgresql://postgres.ref:${encoded}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    );
    expect(options.user).toBe("postgres.ref");
    expect(options.password).toBe(password);
    expect(options.host).toBe("aws-0-ap-south-1.pooler.supabase.com");
    expect(options.port).toBe(6543);
    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("keeps certificate verification for non-Supabase sslmode=require", () => {
    const options = postgresPoolOptions("postgresql://app:secret@db.internal:5432/app?sslmode=require");
    expect(options.ssl).toEqual({ rejectUnauthorized: true });
  });

  it("strips wrapping quotes from the URL", () => {
    const options = postgresPoolOptions(
      '"postgresql://postgres:secret@db.abc123.supabase.co:5432/postgres"',
    );
    expect(options.host).toBe("db.abc123.supabase.co");
  });
});

describe("parseEnvFile", () => {
  it("reads DATABASE_URL without treating other keys as the connection string", () => {
    const parsed = parseEnvFile("ADMIN_SESSION_SECRET=abc\nDATABASE_URL=postgresql://postgres:x@localhost:5432/postgres\n");
    expect(parsed.DATABASE_URL).toBe("postgresql://postgres:x@localhost:5432/postgres");
    expect(parsed.ADMIN_SESSION_SECRET).toBe("abc");
  });
});
