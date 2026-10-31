# DATA SOURCES

Where information comes from, how it is labelled, and how to add sources.

## News

- **Live feed:** PIB (Press Information Bureau) Hindi RSS — `https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&RegId=3` (enabled by default in `lib/news.ts` / `data/news.ts`).
- Refresh path: `/api/cron/news` (Vercel cron `0 4 * * *`, requires `CRON_SECRET`) → `refreshNews()` → cached 30 min → public `/api/news` and homepage.
- `KBP_DISABLE_LIVE_NEWS=1` forces demo content (used by E2E).
- If the feed is unreachable, demo articles are returned and **always** carry an explicit demo/unverified label; they are never presented as live news.

## Representatives

- No representative names are seeded. The directory shows unverified state with official source links (Election Commission, state legislative assembly, municipal bodies, district administration).
- Verified datasets can be imported through the admin import workflow (`/api/admin/representatives` + admin UI) using the official import schema (`representativeImportSchema` in `lib/validation.ts`).
- Never invent names, parties or contacts; unverified areas must show "Data not verified yet".

## Quizzes and assistant answers

- All quiz questions include official source links (`sources` on each question).
- Assistant intents link only to verified or clearly labelled data; answers never invent facts.

## Demo content policy

- News, polls, issues, reviews, discussions, Q&A entries seeded as demo are flagged `isDemo` and labelled in UI (`डेमो` / `Demo`, "not verified news").
- Demo polls never represent real public opinion; quiz scores are learning-only.

## Adding a new official source

1. Add/update the source entry (id, name, feedUrl, language, enabled) in `data/news.ts`.
2. Keep only lawful, official feeds; respect rate limits and attribution.
3. Prefer original summaries + source links over republishing full articles.
4. Document the change in `DATA_SOURCES.md`.

## Verification metadata

Every fact-sensitive record should carry source, verification status and last-updated metadata; demo records are exempt from "verified" claims.
