# SECURITY

Security model and practices for **Kya Bolti Public**.

## Admin authentication

- Admin login is disabled unless both `ADMIN_PASSWORD` (min 12 chars) and `ADMIN_SESSION_SECRET` are set.
- No default credentials exist.
- Session cookie: HMAC-signed (SHA-256), HttpOnly, SameSite=strict, Secure-in-production flag where applicable.
- Login rate limiting (in-memory) on `/api/admin/login`.
- Admin session validation server-side on every privileged admin route; client checks are cosmetic only.
- Admin password comparison uses hashed comparison.

## API hardening

- All mutating API routes validate input with Zod schemas (`lib/validation.ts`).
- Same-origin checks on state-changing (POST/PUT/DELETE) requests.
- In-memory rate limiting on abuse-prone endpoints (login, voting, contact, admin mutations).
- Security headers via `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`.
- API GET/ mutation responses use no-store caching for dynamic content.

## Client-side

- React output escaping; no dangerouslySetInnerHTML with user data.
- Zod-validated forms; no raw HTML injection.
- Duplicate poll voting prevented via HttpOnly random voter cookie whose value is a server-side SHA-256 hash (no PII in cookie).

## Data & privacy

- Public posts must not include phone numbers, home addresses, IDs or personal data; enforced via validation + UI guidance.
- Contact messages stored via repository (JSON/Postgres) and reviewable in admin.
- Minimal server-side logging; no secrets logged.

## Known limitations

- Rate limits are in-memory (per-instance); a shared store (e.g., Upstash Redis) is a future improvement.
- Local JSON store is not multi-instance safe.
- Security headers and auth are implemented; third-party pen-testing is recommended before handling sensitive data at scale.

## Reporting a vulnerability

Do not open public issues for security reports. Contact via `/contact` or privately via the maintainer. Include reproduction steps.

## Compliance note

This platform is an independent civic awareness project. It is not a government body and does not claim legal/regulatory compliance without review.
