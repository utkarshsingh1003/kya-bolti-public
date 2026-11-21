-- Kya Bolti Public — migration 010
-- Persistent news management, source automation and scheduled publishing.
--
-- Rules:
--  * Additive only. No table, column, row or index is dropped.
--  * `news_sources` already exists (001/004/007); this migration only adds
--    management columns with safe defaults.
--  * Every statement is idempotent so a partially applied migration can be
--    re-run safely.
--  * New tables are protected for the least-privilege `kbp_app` role when it
--    exists (see 008). RLS is enabled, `anon` stays denied.

-- ---------------------------------------------------------------------------
-- 1. Extend the existing news_sources table
-- ---------------------------------------------------------------------------

alter table news_sources add column if not exists category text not null default 'national';
alter table news_sources add column if not exists trust_status text not null default 'untrusted';
alter table news_sources add column if not exists approval_policy text not null default 'manual';
alter table news_sources add column if not exists auto_publish boolean not null default false;
alter table news_sources add column if not exists last_error text;
alter table news_sources add column if not exists last_success_at timestamptz;
alter table news_sources add column if not exists created_at timestamptz not null default now();
alter table news_sources add column if not exists updated_at timestamptz not null default now();

create index if not exists news_sources_enabled_idx on news_sources (enabled, trust_status);

-- ---------------------------------------------------------------------------
-- 2. News categories
-- ---------------------------------------------------------------------------

create table if not exists news_categories (
  id text primary key,
  name_hi text not null,
  name_en text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_categories_active_idx on news_categories (active, sort_order);

-- ---------------------------------------------------------------------------
-- 3. News articles
-- ---------------------------------------------------------------------------

create table if not exists news_articles (
  id text primary key,
  slug text not null,
  title text not null,
  title_hi text,
  title_en text,
  short_description text not null default '',
  summary_hi text,
  summary_en text,
  content text not null default '',
  image_url text,
  image_alt text,
  category text not null default 'local',
  tags text[] not null default '{}'::text[],
  author text,
  source_id text references news_sources(id) on delete set null,
  source_name text not null default 'Kya Bolti Public',
  source_url text,
  original_url text,
  language text not null default 'hi',
  featured boolean not null default false,
  breaking boolean not null default false,
  seo_title text,
  seo_description text,
  status text not null default 'draft',
  publish_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fetched_at timestamptz,
  fingerprint text,
  duplicate_key text,
  rejection_reason text,
  approved_by text,
  approved_at timestamptz,
  is_demo boolean not null default false,
  constraint news_articles_status_check check (
    status in ('draft', 'pending', 'approved', 'scheduled', 'published', 'rejected', 'failed')
  ),
  constraint news_articles_language_check check (language in ('hi', 'en'))
);

create unique index if not exists news_articles_slug_uidx on news_articles (slug);
create unique index if not exists news_articles_duplicate_key_uidx
  on news_articles (duplicate_key) where duplicate_key is not null;
create index if not exists news_articles_status_idx
  on news_articles (status, (coalesce(publish_at, published_at, created_at)) desc);
create index if not exists news_articles_source_idx on news_articles (source_id, created_at desc);
create index if not exists news_articles_category_idx on news_articles (category, created_at desc);
create index if not exists news_articles_featured_idx on news_articles (featured) where featured = true;
create index if not exists news_articles_breaking_idx on news_articles (breaking) where breaking = true;

-- ---------------------------------------------------------------------------
-- 4. Approval history
-- ---------------------------------------------------------------------------

create table if not exists news_approval_history (
  id text primary key,
  article_id text references news_articles(id) on delete set null,
  action text not null,
  actor text not null default 'admin',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists news_approval_history_article_idx
  on news_approval_history (article_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Fetch logs
-- ---------------------------------------------------------------------------

create table if not exists news_fetch_logs (
  id text primary key,
  source_id text references news_sources(id) on delete set null,
  source_name text not null,
  status text not null default 'success',
  items_found integer not null default 0,
  items_new integer not null default 0,
  items_published integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists news_fetch_logs_started_idx on news_fetch_logs (started_at desc);
create index if not exists news_fetch_logs_status_idx on news_fetch_logs (status, started_at desc);

-- ---------------------------------------------------------------------------
-- 6. Automation settings (singleton row)
-- ---------------------------------------------------------------------------

create table if not exists news_automation_settings (
  id integer primary key,
  auto_publish_enabled boolean not null default false,
  fetch_enabled boolean not null default true,
  default_language text not null default 'hi',
  timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now(),
  constraint news_automation_settings_singleton check (id = 1),
  constraint news_automation_settings_language_check check (default_language in ('hi', 'en'))
);

insert into news_automation_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Seed the default categories and the existing PIB feed
-- ---------------------------------------------------------------------------

insert into news_categories (id, name_hi, name_en, sort_order) values
  ('local', 'स्थानीय नागरिक मुद्दे', 'Local civic issues', 10),
  ('state', 'राज्य की राजनीति', 'State politics', 20),
  ('national', 'राष्ट्रीय राजनीति', 'National politics', 30),
  ('schemes', 'सरकारी योजनाएँ', 'Government schemes', 40),
  ('education', 'शिक्षा', 'Education', 50),
  ('roads', 'सड़क और बुनियादी ढाँचा', 'Roads & infrastructure', 60),
  ('water', 'पानी और बिजली', 'Water & electricity', 70),
  ('health', 'स्वास्थ्य', 'Health', 80),
  ('employment', 'रोज़गार', 'Employment', 90),
  ('municipal', 'नगरपालिका सेवाएँ', 'Municipal services', 100),
  ('safety', 'जन सुरक्षा', 'Public safety', 110)
on conflict (id) do nothing;

-- The previously hard-coded feed becomes an editable, untrusted source.
-- It is disabled and needs an explicit review before it can publish anything.
insert into news_sources
  (id, name, feed_url, language, scope, enabled, attribution, terms_note,
   category, trust_status, approval_policy, auto_publish)
values
  ('pib-hindi',
   'पत्र सूचना कार्यालय (PIB) — हिंदी',
   'https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
   'hi', 'national', false,
   'स्रोत: पत्र सूचना कार्यालय (PIB), भारत सरकार',
   'सरकारी जन-सूचना फ़ीड। शीर्षक, छोटा सारांश और मूल लिंक के साथ श्रेय दिया जाता है।',
   'national', 'untrusted', 'manual', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Least-privilege application role (only when provisioned)
-- ---------------------------------------------------------------------------

do $$
declare
  app_role text := 'kbp_app';
  tbl text;
  new_tables text[] := array[
    'news_categories', 'news_articles', 'news_approval_history',
    'news_fetch_logs', 'news_automation_settings'
  ];
begin
  if not exists (select 1 from pg_roles where rolname = app_role) then
    raise notice 'KBP 010: role % is absent; skipping grants and policies', app_role;
    return;
  end if;

  foreach tbl in array new_tables loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    execute format('grant select, insert, update, delete on table public.%I to %I', tbl, app_role);
    execute format('alter table public.%I enable row level security', tbl);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = tbl and policyname = tbl || '_kbp_app_allow'
    ) then
      execute format(
        'create policy %I on public.%I for all to %I using (true) with check (true)',
        tbl || '_kbp_app_allow', tbl, app_role
      );
    end if;
  end loop;

  -- news_sources already has the kbp_app policy from 008.
  execute format('grant select, insert, update, delete on table public.news_sources to %I', app_role);
end $$;

-- ---------------------------------------------------------------------------
-- Rollback (manual, only if the news feature must be removed entirely).
-- Existing news_sources rows and all pre-010 data are preserved by the
-- additive columns; dropping the new tables cannot affect other features.
--
-- drop table if exists news_fetch_logs;
-- drop table if exists news_approval_history;
-- drop table if exists news_automation_settings;
-- drop table if exists news_categories;
-- drop table if exists news_articles;
-- alter table news_sources drop column if exists category;
-- alter table news_sources drop column if exists trust_status;
-- alter table news_sources drop column if exists approval_policy;
-- alter table news_sources drop column if exists auto_publish;
-- alter table news_sources drop column if exists last_error;
-- alter table news_sources drop column if exists last_success_at;
-- alter table news_sources drop column if exists created_at;
-- alter table news_sources drop column if exists updated_at;
