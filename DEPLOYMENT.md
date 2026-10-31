# DEPLOYMENT

Deploying **Kya Bolti Public** to Vercel with the custom domain **kyaboltipublic.in** (owned via GoDaddy).

## Current deployment status (as of this writing)

- **Vercel CLI / GitHub auth available in this environment:** **No**. The `vercel` CLI, `gh` CLI and a git remote were not available, so no preview or production deployment has been performed from this workspace.
- **Domain kyaboltipublic.in:** Owned by the project owner via GoDaddy; DNS configuration status not verified from here.
- **HTTPS:** Not verified against any live deployment.

These must be verified by the owner or after running the steps below with authenticated accounts.

## Vercel deployment (preview first, then production)

Prerequisites: Vercel account with GitHub connected (or `vercel` CLI installed and authenticated).

```bash
# 1. Install Vercel CLI (if needed)
npm i -g vercel

# 2. Log in
vercel login

# 3. Preview deployment from local directory
vercel

# 4. Production deployment
vercel --prod
```

### Environment variables for Vercel

Set in Project → Settings → Environment Variables (or via CLI):

```
NEXT_PUBLIC_SITE_URL=https://kyaboltipublic.in
DATABASE_URL=<postgres connection string>   # optional; without it app runs in-memory storage
ADMIN_PASSWORD=<strong password>
ADMIN_SESSION_SECRET=<long random secret>
CRON_SECRET=<long random secret>
```

Without `DATABASE_URL`, the Vercel deployment uses serverless in-memory storage (data does not persist across invocations) — this must be disclosed to users.

### vercel.json

The repo includes `vercel.json` with the news refresh cron:

```json
{
  "crons": [{ "path": "/api/cron/news", "schedule": "0 4 * * *" }]
}
```

The cron endpoint (`/api/cron/news`) refuses to run unless `CRON_SECRET` is set. Cron jobs only take effect on Vercel deployments; they are **not** active during local development.

## GoDaddy DNS for kyaboltipublic.in

After a Vercel production deployment exists and its domains are assigned, Vercel provides exact DNS records (typically an `A`/`CNAME` at Vercel's nameservers or specific `ALIAS`/`CNAME` records). The owner must:

1. Log in to GoDaddy.
2. Open DNS management for `kyaboltipublic.in`.
3. Add the records exactly as shown in the Vercel dashboard for the production domain.
4. Do not change nameservers without explicit approval.

## Post-deploy verification checklist

- [ ] Production URL responds over HTTPS.
- [ ] `https://kyaboltipublic.in` serves the app; canonical/OG URLs correct.
- [ ] Admin login works only with set credentials; no default exists.
- [ ] `/api/health` reports expected storage/admin/cron state.
- [ ] Run the E2E smoke suite against the preview (`PLAYWRIGHT_BASE_URL=... npx playwright test`).
- [ ] Domain → Vercel DNS → HTTPS green in Vercel dashboard.

Only deploy production after preview checks pass. Do not claim domain/HTTPS status otherwise.

## Rollback

Vercel keeps previous deployments; use the dashboard or `vercel rollback <deployment-url>`.
