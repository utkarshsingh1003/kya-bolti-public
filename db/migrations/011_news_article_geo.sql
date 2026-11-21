-- Kya Bolti Public — migration 011
-- Adds the optional geo scope used by public news filters and the admin editor.
--
-- 010 created `news_articles` without `state_id` / `district_id`, but the
-- Postgres repository maps and writes both columns. Keep this as a separate
-- additive migration so the already-applied 010 checksum stays valid.
--
-- Rules: additive only, idempotent, no data loss.

alter table news_articles add column if not exists state_id text;
alter table news_articles add column if not exists district_id text;

create index if not exists news_articles_state_idx
  on news_articles (state_id, created_at desc);
create index if not exists news_articles_district_idx
  on news_articles (district_id, created_at desc);

-- Rollback (manual, only if the news feature is removed entirely):
-- alter table news_articles drop column if exists district_id;
-- alter table news_articles drop column if exists state_id;
