# क्या बोलती PUBLIC (Kya Bolti Public)

**Tagline:** जनता की बात, सबकी आवाज़

An independent, Hindi-first civic awareness and public participation platform for Indian neighbourhoods — news, representatives, polls, issues, reviews, discussions, Q&A, quizzes, and the "जनता साथी" voice/text assistant.

- **Site:** kyaboltipublic.in
- **Status:** First public release (web). Mobile app architecture prepared but not built.

## What the platform does

| Area | Route | Notes |
| --- | --- | --- |
| Homepage | `/` | Hindi-first hero, latest local news, representatives, polls, issues, quizzes, assistant entry. |
| News | `/news` | Live RSS refresh via `/api/cron/news` + `/api/news`, clearly labelled demo content fallback. |
| Representatives | `/representatives` | "Know your representative" directory. No names are invented; unverified areas show official source links. |
| Issues | `/issues`, `/issues/new` | Citizen issue reporting with tracking codes, statuses, official portals. |
| Polls | `/polls` | Community polls with one-vote-per-browser (hashed cookie), live results. Demo polls clearly labelled. |
| Reviews | `/reviews` | Structured local service reviews with ratings and moderation. |
| Discussions | `/discussions` | Area-based community threads with replies and reporting. |
| Q&A | `/qa` | Citizen questions with official-source answers; community answers marked unverified. |
| Games | `/games`, `/games/[slug]` | 8 educational quizzes (constitution, who-does-what, schemes, local responsibility, geography, myth-vs-fact, voter awareness, daily civic). |
| Assistant | `/assistant` | "जनता साथी" — browser speech recognition + synthesis with Hindi/English intents and text fallback. |
| Search | `/search` | Full-text search across pages, news, polls, quizzes, issues, Q&A. |
| Admin | `/admin` | Secure login + moderation dashboard (login/logout/overview/moderation/issues/answer/representatives). |
| Contact | `/contact` | Citizen contact messages collected for moderation. |
| Health | `/api/health` | Storage/admin/cron configuration status. |

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Validation:** Zod (server-side on every API mutation)
- **Storage:** JSON file store (local/dev) or PostgreSQL adapter (when `DATABASE_URL` is set); migrations in `db/migrations/`
- **News:** RSS parsing (PIB Hindi feed enabled; demo content labelled when unavailable) — refreshed by `/api/cron/news`
- **Voice:** Browser Web Speech API (Hindi default; English + structure for more languages)
- **Tests:** Vitest (unit, 77 tests) + Playwright (E2E smoke, 9 tests)
- **Quality:** ESLint, `tsc --noEmit`, `next build`

## Commands

```bash
npm install
npm run dev        # local dev server (http://localhost:3100)
npm run build      # production build
npm run start      # serve production build
npm run lint
npm run typecheck
npm run test       # unit tests (Vitest)
npm run test:e2e   # browser smoke tests (Playwright, starts its own dev server)
npm run check      # lint + typecheck + unit tests + build
npm run db:migrate # apply Postgres migrations (requires DATABASE_URL)
```

## Feature status

- **Working:** public pages, navigation, Hindi/English switch, location picker (manual default + optional consent geolocation), polls with one-vote dedupe, quiz scoring, assistant intents, issue form + tracking, reviews, discussions, Q&A, search, share pages, contact, health API, admin login + moderation APIs, security headers, rate limiting, validation, accessibility baseline.
- **Demo / placeholder:** all news, polls, issues, reviews, discussions, Q&A entries and quizzes content that is not live/verified is explicitly labelled (`डेमो`, "Demo", "not verified"). Representative names are intentionally not seeded; unverified states show official source links.
- **Not implemented:** push notifications, native mobile apps, server-side accounts, full CMS, scheduled news cron in production (see DEPLOYMENT.md).

## Documentation

- `SETUP.md` — local setup, env vars, database, admin bootstrap, tests.
- `DEPLOYMENT.md` — Vercel preview/production, GoDaddy DNS, domain/HTTPS status.
- `SECURITY.md` — security model, admin auth, rate limits, data handling.
- `DATA_SOURCES.md` — official sources, demo content policy, feed configuration.
- `docs/admin-moderation.md` — admin/moderation guide.

## Non-goals / disclaimers

- No party or government affiliation; no government emblems.
- Polls are community opinions, not election forecasts.
- Quiz scores are learning-only.
- No personal data (phone/address/ID) required or encouraged in public posts.
- Live data is never fabricated; unavailable feeds fall back to clearly labelled demo content.

## License / contact

- Contact: see `/contact` and footer. Corrections policy: `/corrections`. Community guidelines: `/guidelines`.
