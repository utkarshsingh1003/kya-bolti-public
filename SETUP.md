# SETUP

Complete local setup for **Kya Bolti Public**.

## Prerequisites

- Node.js 20+ (tested on Node 26) and npm 11
- (Optional) PostgreSQL for persistent storage; local JSON store works without it

## Install

```bash
git clone <repo-url> kya-bolti-public
cd kya-bolti-public
npm install
```

## Environment

Copy the example and adjust:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical/OG/sitemap URL | `https://kyaboltipublic.in` |
| `DATABASE_URL` | No | Postgres connection; enables Postgres adapter + migrations | unset → JSON file store |
| `KBP_DATA_DIR` | No | JSON store location | `.data` |
| `KBP_DISABLE_LIVE_NEWS` | No | Set `1` to force demo news mode | unset |
| `KBP_FILE_STORE` | No | Force store backend (`memory` \| `file`) | auto |
| `ADMIN_PASSWORD` | Yes for admin | Admin login password (12+ chars) | none — no default |
| `ADMIN_SESSION_SECRET` | Yes for admin | HMAC session secret | none — no default |
| `CRON_SECRET` | Yes for cron | Shared secret for `/api/cron/news` | none — cron refuses to run |

Generate secrets, e.g.:

```bash
openssl rand -base64 32   # ADMIN_SESSION_SECRET / CRON_SECRET
openssl rand -hex 16      # ADMIN_PASSWORD alternative
```

**Never commit `.env`, `.env.local`, or any file containing real secrets.**

## Persistent storage (required for production)

The app supports two backends through `lib/store`:

- **PostgreSQL** (preferred, required for production persistence) — selected when `DATABASE_URL` is set.
- **JSON file** — selected for local development (path from `KBP_DATA_DIR`, default `.data/store.json`).

On Vercel serverless without a database, the app now **refuses to silently fall back to in-memory storage** and returns a clear storage error; set `DATABASE_URL` to enable persistence.

### Supabase PostgreSQL setup

1. Create a Supabase project (free tier is sufficient) at https://supabase.com.
2. In the Supabase dashboard: **Project Settings → Database → Connection string** (choose the direct/db connection URI; the pooled connection string also works with `pg`).
3. Copy the connection string. It looks like:
   `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
4. Set it as an environment variable (locally in `.env.local`, in Vercel in Project → Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   ```
5. Redeploy the app after adding the variable.
6. Apply the schema:
   ```
   npm run db:migrate
   ```
   (Applies `db/migrations/001_init.sql` transactionally with `schema_migrations` tracking. It uses `create table if not exists` and conflict-aware inserts, so it is safe to re-run.)

### Environment variables for persistent production storage

| Variable | Required for | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes (production) | PostgreSQL connection string (Supabase). Enables Postgres repository. |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical/OG URL. |
| `KBP_DATA_DIR` | No | JSON file store location (local dev). |
| `KBP_DISABLE_LIVE_NEWS` | No | Force demo news mode. |
| `KBP_FILE_STORE` | No | Force file store backend. |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Yes for admin | Admin auth. |
| `CRON_SECRET` | Yes for cron | News refresh cron secret. |

## Run locally

```bash
npm run dev
```

Open http://localhost:3100 (use `localhost`, not `127.0.0.1`, for local dev tooling).

## Database (optional, recommended for production)

```bash
npm run db:migrate   # requires DATABASE_URL
```

Migrations live in `db/migrations/`. The JSON file store is used automatically when `DATABASE_URL` is unset (data persists in `.data/store.json` locally; on Vercel serverless it runs in-memory mode and must be disclosed).

> **Production:** set `DATABASE_URL` (e.g. Supabase PostgreSQL) before going live. Without it, the deployed app now returns a clear storage error instead of silently using in-memory storage.

## Admin bootstrap

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local`, restart, then:

- Open `/admin/login`
- Set a strong password (no default exists)
- Admin sessions: HMAC-signed, HttpOnly cookie, rate-limited login
- Admin endpoints under `/api/admin/*` require the session; all mutations are Zod-validated

See `docs/admin-moderation.md` for the moderation workflow.

## Tests

```bash
npm run test        # Vitest unit tests (77 tests)
npm run test:e2e    # Playwright smoke tests (spins up its own dev server on :3100 with KBP_DISABLE_LIVE_NEWS=1 and KBP_DATA_DIR=tests/.e2e-data)
npm run lint
npm run typecheck
npm run build
npm run check       # everything above except e2e
```

Playwright notes:

- Use `localhost` as the hostname; Next dev blocks dev resources on `127.0.0.1`.
- E2E suite: `tests/e2e/smoke.spec.ts`.

## Production build check

```bash
npm run build
npm run start
```

## Voice assistant setup

No API keys required. Uses browser SpeechRecognition/SpeechSynthesis with Hindi default, English fallback, text input fallback, mute/replay controls.

## NLP / LLM integrations

No LLM keys are required. Assistant uses intent mapping in `lib/assistant-intents.ts`; LLM-backed answers only if explicitly configured and approved.
