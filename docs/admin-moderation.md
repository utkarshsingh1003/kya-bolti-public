# Admin & Moderation Guide

Secure moderation workflows for **Kya Bolti Public** (web admin at `/admin`).

## Access

- Admin UI: `/admin`, login: `/admin/login`.
- Requires both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to be configured. If unset, admin APIs return `503` and the UI shows a configuration notice — **there is no default login**.

### Login flow

1. `POST /api/admin/login` with `{ password }` → verified via constant-time compare; rate limited.
2. On success, HMAC-signed session cookie is set (HttpOnly, SameSite=strict, Secure in production).
3. `POST /api/admin/logout` clears the cookie.

All privileged routes check the session server-side via `requireAdmin` (`lib/security.ts`).

## Admin endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/admin/overview` | Counts/stats snapshot. |
| `GET /api/admin/moderation` | List reported/flags content. |
| `PATCH /api/admin/moderation` | Apply moderation actions (schema-validated). |
| `GET /api/admin/issues` | Review citizen issues. |
| `PATCH /api/admin/issues` | Update issue status (`submitted → under_review → verified → forwarded → resolved`). |
| `POST /api/admin/answer` | Publish a reviewed answer for a question. |
| `POST /api/admin/representatives` | Import verified representative dataset (schema-validated). |

## Moderation workflows

1. **Reports** — citizen reports are stored with reasons; admin reviews via `/api/admin/moderation`.
2. **Issues** — admin updates lifecycle status; notes should not claim government forwarding without real action.
3. **Q&A answers** — answers published through admin are treated as reviewed/verified; community answers remain unverified until then.
4. **Representatives** — imports must use official datasets; unverified imports are flagged by design.

## Operational notes

- Do not share admin credentials. Rotate `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` via environment changes and re-login.
- Keep `CRON_SECRET` set for the news refresh endpoint; rotate if exposed.
- Admin actions are rate limited and validated server-side.
- Keep production `DATABASE_URL` (Postgres) for persistent admin-created content; otherwise local JSON store is used (ephemeral on serverless).

## Remaining work

- Full content authoring UI (news editor, poll editor, quiz editor) beyond current admin scope.
- Richer moderation tooling (bulk actions, audit log UI).
