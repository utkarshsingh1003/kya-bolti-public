# Production Readiness Audit — Kya Bolti Public

**Audit date:** 2026-11-14  
**Repository:** `/Users/utkarshsingh/Desktop/kya-bolti-public`  
**Branch:** `integration/db-repair-vyangbaan`  
**HEAD:** `21e8168 Support Supabase Session Pooler on port 5432`  
**Remote baseline:** `origin/master` at `d6aa7bf`  
**Working tree:** 2 modified files, 3 pre-existing untracked artifacts (plus this report), 0 commits made during this audit

**Method:** static code/document inspection plus local typecheck, lint, unit tests, production build and Playwright smoke tests. No database connection, SQL, migration, dry-run, deployment, commit or push was performed.

**Evidence labels:** **[V]** verified in this audit · **[U]** unverified · **[A]** inference/assumption.

---

## Verification evidence

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **[V]** PASS (exit 0) |
| ESLint | `npx eslint .` | **[V]** PASS, 0 errors, 2 warnings |
| Unit tests | `npx vitest run` | **[V]** PASS, 13 files / 117 tests |
| Production build | `DATABASE_URL='' npx next build --webpack` | **[V]** PASS (`BUILD_OK`) |
| E2E smoke | `DATABASE_URL='' npx playwright test` | **[V]** 10/10 passed, but 3 hydration mismatches logged |
| Postgres adapter tests | `rg "store/postgres" tests` | **[V]** none exist |
| Git position | `git rev-list --left-right --count origin/master...HEAD` | **[V]** `0 5` — integration branch is 5 commits ahead, no upstream |
| DB contact | — | **[V]** no database was contacted |

Lint warnings (pre-existing, but one is security-relevant):

- `app/api/account/profile/route.ts:5` — `publicUser` imported but unused.
- `lib/accounts.ts:45` — `_passwordHash` unused (intentional destructure).

---

## 1. What is fully completed

### Code and migration safety — committed

**[V]** Commit `a99cd37` implements:

- Explicit `KBP_DB_ENV=staging|production`; production additionally requires `KBP_ALLOW_PRODUCTION_MIGRATIONS=1`.
- No `.env.local` / `.env` fallback for migrations unless `KBP_ALLOW_ENV_FILE_MIGRATIONS=1`.
- Genuinely read-only `--dry-run` and `--verify` (no metadata DDL, `default_transaction_read_only=on`).
- Per-file transactions, advisory lock, connect/statement/lock timeouts.
- Checksum tracking, legacy rows, missing/out-of-order detection, baseline re-apply guard.
- `schema_migrations` validation and preflight before any metadata write.

### Session Pooler support — committed

**[V]** Commit `21e8168` distinguishes Supabase Session Pooler on port `5432` from unsafe poolers; still rejects `6543`, `pgbouncer=true`, `pool_mode=transaction`, unsupported ports and unverifiable third-party poolers.

### Migration chain — committed

**[V]** Commit `5cc03b2` adds `004`–`006`:

- `004`: additive `ADD COLUMN IF NOT EXISTS` reconciliation for 19 tables; no drops/truncates.
- `005`: Supabase RLS defense-in-depth; deduplicates policies; revokes `anon`/`authenticated` on `schema_migrations`; skips when Supabase roles are absent.
- `006`: `owner_id` foreign keys added `NOT VALID`, validated only when orphan counts are zero; no destructive SQL.

### Application surface

**[V]** 42 API route files / 57 handlers exist. Verified implementations include:

- Account registration/login/logout/me, scrypt password hashing, HMAC-signed HttpOnly session cookies.
- Admin login/logout and `requireAdmin` on all privileged admin routes.
- Polls, voting with DB-level `unique (poll_id, voter_hash)`, issues + tracking codes, reviews, discussions, Q&A, reports, contact, quiz, search, news, geocode, health.
- Zod validation on mutations, same-origin checks, rate limiting, security headers, parameterized SQL.
- Public UI routes for all advertised features, including Vyangbaan (`/jokes`).

### TLS root-cause and local CA support

**[V]** The staging failure is an untrusted Supabase root (`SELF_SIGNED_CERT_IN_CHAIN`), not hostname/expiry. Node `v26.12.1` bundles 118 public roots and no Supabase CA.

**[V]** Working-tree changes add `KBP_DATABASE_CA_CERT_PATH` and `sslrootcert` support in `lib/postgres-config.ts`, keep `rejectUnauthorized: true`, fail closed on unreadable/empty CA, and remove the old `rejectUnauthorized: false` fallback. 16/16 `postgres-config` tests pass.

**[V]** `prod-ca-2021.crt` in the working tree is the Supabase Root 2021 CA (`CN=Supabase Root 2021 CA`, valid to 2031).

---

## 2. What is partially completed or unverified

| Area | State | Evidence |
|---|---|---|
| Staging database identity/schema/history | **[U]** never connected | No `schema_migrations` inspection; linked Supabase project is **not** staging-named; `.env.local` pooler URLs cannot be proven staging |
| Staging backups / PITR | **[U]** not checked | Supabase dashboard not accessed |
| TLS fix against staging | **[U]** not exercised | CA support is uncommitted and has never been used against the pooler |
| CA support on Vercel runtime | **[U]** packaging risk | `KBP_DATABASE_CA_CERT_PATH` needs a file at runtime; the cert is untracked and Next.js serverless tracing may not include it |
| PostgreSQL adapter | **[U]** untested | 1,189-line `lib/store/postgres.ts`; no test imports it; E2E uses the JSON/file store |
| Backend runtime behaviour | **[U]** not verified against Postgres | Registration, login, polls, voting, issues, admin and RLS only exercised against the file store |
| Security review | **[U]** static only | Found the password-hash leak and admin password-length gap below |
| App-level timeouts | **Partial** | Migration runner has statement/lock timeouts; application `pg` pool does not |
| Documentation | **Partial/stale** | See P2 findings |
| Production deployment source | **[U]** | No `.vercel/project.json`; Vercel branch/env not inspected |

---

## 3. What is still pending for production launch

1. Commit and push/merge the integration branch.
2. Run read-only staging verification with the Supabase CA and staging ref pin.
3. Confirm staging backups/PITR.
4. Obtain approval and apply `001`–`006` to staging.
5. Runtime-test registration, login, polls, voting, issues, admin, RLS and duplicate-vote prevention against staging.
6. Fix the security and reliability defects in section 4.
7. Read-only Production database audit and schema comparison.
8. Prepare and approve the Production migration plan.
9. Configure Vercel Production environment variables, including CA strategy.
10. Deploy a preview, run E2E against it, then deploy Production.
11. Verify the live domain, HTTPS, auth, polls, voting and admin.

---

## 4. Critical blockers and risks

### P0 — Integration branch is not deployed

**[V]** `HEAD` is 5 commits ahead of `origin/master`; the branch has no upstream and has not been pushed.

**[V]** `origin/master` contains only migrations `001`–`003`, no `scripts/migrate-lib.ts`, and the old `lib/postgres-config.ts` that sets `rejectUnauthorized: false` for Supabase. The old `scripts/migrate.mjs` still reads `.env.local`/`.env`.

**[A]** If Vercel deploys `master` (the remote default), Production is running code without any of the hardening, migration `004`–`006`, Vyangbaan, or TLS fix. Deployment source must be confirmed before any launch claim.

### P0 — Staging is completely unverified

**[U]** No staging connection, schema inspection, migration-history check or backup confirmation has been performed. `.env.local` contains pooler URLs that do not match the linked project ref; using them could target the wrong project. The linked project name is not staging-named.

### P0 — CA support is not deployable yet

**[V]** The CA change is uncommitted and `KBP_DATABASE_CA_CERT_PATH` is undocumented.

**[V]** `prod-ca-2021.crt` is untracked.

**[A]** A runtime `fs.readFileSync` path to a repo-root certificate may not be included in a Vercel serverless bundle. If Production uses the Session Pooler with `rejectUnauthorized: true` and no CA is available at runtime, the app will fail with the same certificate-chain error. Resolve with one of:

- Commit the public CA and import it at build time, or
- Add inline PEM support (e.g. `KBP_DATABASE_CA_CERT`), or
- Verify that the chosen Vercel packaging includes the file path.

### P1 — Password hash leaked by the profile API

**[V]** `app/api/account/profile/route.ts:33` returns `updated` directly:

```ts
return noStore({ ok: true, user: updated });
```

**[V]** `publicUser` is imported but unused (ESLint warning). Both `updateUser` implementations type the result as `PublicUser` but build it with `{ ...user }`, which retains `passwordHash` at runtime:

- `lib/store/postgres.ts:1075`
- `lib/store/index.ts:964`

**[V]** Result: an authenticated `POST /api/account/profile` response contains the user's scrypt password hash. The fix is `publicUser(updated)` plus a regression test.

### P1 — PostgreSQL adapter has no automated coverage

**[V]** No test imports `lib/store/postgres.ts`. All unit tests use `JsonRepository`; all E2E tests use the file/demo store. The actual Production database path is unverified.

### P1 — Application pool has no statement/lock timeout

**[V]** `lib/store/postgres.ts:1181-1183` sets only `max`, `idleTimeoutMillis` and `connectionTimeoutMillis`. There is no `statement_timeout`, `lock_timeout` or `query_timeout`. A slow query can hold a serverless invocation until the platform timeout. The migration runner does set these (`scripts/migrate.mjs:384-385`).

### P1 — First request can write seed data

**[V]** `createPostgresRepository` calls `initialize()` (`lib/store/postgres.ts:1187`), which calls `seed()` (`277-283`) and inserts demo rows when `polls` is empty.

**[V]** `/api/health` calls `getRepository()` and therefore can trigger that seed write. Any “read-only” health check against an empty database is not actually read-only. This matters for the Staging approval gate.

### P2 — Hydration mismatches

**[V]** Playwright logs 3 hydration errors. Exact mismatch in `/issues`:

- Server: `14 नवंबर 2026`
- Client: `14 नवंबर, 2026`

Cause: `formatDate` uses `toLocaleDateString("hi-IN", ...)` in `lib/labels.ts:77-86`, and Node/browser ICU output differs. Similar risk exists in `toLocaleString` calls in `buzz-explorer`, `news-explorer`, `updates-explorer` and `admin-dashboard`. React recovers client-side, but this causes console errors and a re-render flash.

### P2 — Untracked staging data and certificate artifacts

**[V]** Untracked and not gitignored:

- `kya-bolti-public/staging-20261114-172122/` — `schema.sql`, `data.sql` (35 INSERT statements), `roles.sql`
- `prod-ca-2021.crt`
- `migration-review.txt`

The staging dump may contain real data. `git add .` would commit it. Secure or delete the dump, and add an ignore rule before any commit.

### P2 — Admin password length is not enforced

**[V]** `adminConfigured()` only checks presence (`lib/security.ts:83-85`); `adminLoginSchema` accepts `min(1)` (`lib/validation.ts:147-149`). Docs claim a 12-character minimum (`SECURITY.md:7`, `SETUP.md:33`). A weak admin password is accepted.

### P2 — Health reports `ok: true` in demo mode

**[V]** `app/api/health/route.ts:19-24` returns `ok: databaseOk` and `persistent: false`. In Vercel demo mode `getStats()` succeeds, so `ok` is `true` even though storage is not persistent. Monitoring that checks only `ok` will miss a missing database.

### P2 — Documentation drift

**[V]** Contradictions that would mislead an operator:

- `README.md:18` says one-vote-per-browser; voting now requires an account.
- `README.md:37` says 77 unit / 9 E2E tests; actual 117 / 10.
- `README.md:59` says server-side accounts are “not implemented”; they exist.
- `SETUP.md:53,98` and `DEPLOYMENT.md:43` say production without `DATABASE_URL` refuses/errors; current code enters read-only demo mode and shows a banner.
- `SECURITY.md:9` says `SameSite=strict`; code uses `lax` (`lib/security.ts:107`).
- `AUTH_SECRET`, `KBP_DEMO_MODE` and `KBP_DATABASE_CA_CERT_PATH` are undocumented in `.env.example`/`SETUP.md`.
- `DEPLOYMENT.md:7` says `vercel`/`gh` are unavailable; both CLIs are installed. No `.vercel` project link exists.

### P3 — Other observations

- No CI workflow (`.github` absent).
- No `engines` field in `package.json`.
- In-memory rate limiting is per serverless instance (documented limitation).
- No Content-Security-Policy header.
- `voterFromRequest`/`voterCookie` are dead code after the move to authenticated voting.

---

## 5. Exact next steps in priority order

### 1. Fix the password-hash leak (code, then test)

Use `publicUser(updated)` in `app/api/account/profile/route.ts`, and add a regression test proving `updateUser`/profile responses omit `passwordHash`.

### 2. Finalise the CA change

- Commit `lib/postgres-config.ts` + tests.
- Document `KBP_DATABASE_CA_CERT_PATH` and `sslrootcert`.
- Decide the Vercel CA strategy (committed/imported CA or inline PEM). Do not deploy until this is resolved.
- Add the CA file to `.gitignore` or intentionally commit it as a public certificate.

### 3. Clean the working tree

Remove or ignore the staging dump, `prod-ca-2021.crt` (after deciding), and `migration-review.txt`. Confirm `git status` is clean before deployment.

### 4. Add application query timeouts

Set `statement_timeout`, `lock_timeout` and `query_timeout` on the `pg` pool, or document a deliberate platform-timeout strategy.

### 5. Run read-only Staging verification

Export privately in the shell; do not paste secrets:

```bash
export KBP_DATABASE_CA_CERT_PATH="$PWD/prod-ca-2021.crt"
export MIGRATION_DATABASE_URL='<staging Session Pooler URL, port 5432>'
export KBP_STAGING_PROJECT_REF='<staging project ref>'

npm run db:migrate:staging:verify
npm run db:migrate:staging:dry-run
```

Review only the non-secret output. Do not run the app against Staging before approval: the first request can seed demo data.

### 6. Confirm Staging backup/PITR

Verify Supabase Staging → Database → Backups/PITR. Record the recovery point.

### 7. APPROVAL GATE A — Staging write

Only after steps 5–6 and explicit approval:

```bash
npm run db:migrate:staging
```

### 8. Runtime-test Staging

After migrations: registration, login, session persistence, poll creation, voting, duplicate-vote rejection, issue tracking, reviews, discussions, Q&A, admin login, admin moderation, RLS denial for `anon`, and `/api/health` persistence.

### 9. Fix hydration and documentation

Make date formatting deterministic (fixed formatter/timezone or suppress hydration on timestamps) and correct the stale README/SETUP/DEPLOYMENT/SECURITY claims.

### 10. Production read-only audit and plan

Inspect Production schema, `schema_migrations`, data, indexes, FKs and RLS. Compare with Staging. Confirm Production backup/PITR. Present the exact migration plan and rollback. **APPROVAL GATE B.**

### 11. Deploy

Merge/push the integration branch (or configure Vercel to deploy it). Set Production env vars, including the CA strategy. Deploy a preview, run E2E against the preview, then **APPROVAL GATE C/D** for Production env changes and final deployment. Verify the live domain, HTTPS, auth, polls, voting and admin.

---

## Final verdict

**NOT PRODUCTION READY.**

Verified strengths: local build/typecheck/lint/unit/E2E all pass; migration chain and runner hardening are well designed; Session Pooler detection and CA support are correctly scoped; core auth and validation primitives are present.

Blocking facts:

1. The integration branch is not pushed or merged; `origin/master` lacks the migrations, hardening, Vyangbaan and TLS fix.
2. Staging has never been verified; no schema, history or backup evidence exists.
3. The CA fix is uncommitted and its Vercel runtime packaging is unresolved.
4. `/api/account/profile` leaks the authenticated user's password hash.
5. The PostgreSQL adapter has zero automated coverage and has never been exercised against a real database.

Production launch should not proceed until items 1–5 are closed and Staging passes the runtime checklist.
