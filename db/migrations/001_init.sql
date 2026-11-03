-- Kya Bolti Public — PostgreSQL schema
-- Run with: npm run db:migrate
-- All fact-sensitive tables carry source/verification metadata.

create table if not exists polls (
  id text primary key,
  question_hi text not null,
  question_en text not null,
  description_hi text not null,
  description_en text not null,
  category text not null default 'civic',
  closes_at timestamptz not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists poll_options (
  id text primary key,
  poll_id text not null references polls(id) on delete cascade,
  label_hi text not null,
  label_en text not null,
  sort_order integer not null default 0
);

create table if not exists poll_votes (
  id bigserial primary key,
  poll_id text not null references polls(id) on delete cascade,
  option_id text not null references poll_options(id) on delete cascade,
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_hash)
);

create table if not exists issues (
  id text primary key,
  tracking_code text not null unique,
  category text not null,
  title text not null,
  description text not null,
  area text not null,
  district_id text not null,
  state_id text not null,
  pin text,
  status text not null default 'submitted',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  official_complaint_url text,
  events jsonb not null default '[]'::jsonb
);

-- CREATE TABLE IF NOT EXISTS does not add columns to a pre-existing issues table.
alter table issues add column if not exists pin text;

create index if not exists issues_district_idx on issues (district_id, created_at desc);
create index if not exists issues_status_idx on issues (status);

create table if not exists reviews (
  id text primary key,
  service_category text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  area text not null,
  district_id text not null,
  state_id text not null,
  display_name text,
  status text not null default 'published',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_district_idx on reviews (district_id, created_at desc);

create table if not exists threads (
  id text primary key,
  title text not null,
  body text not null,
  category text not null,
  district_id text not null,
  state_id text not null,
  author_alias text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  reply_count integer not null default 0,
  status text not null default 'published'
);

create index if not exists threads_district_idx on threads (district_id, created_at desc);

create table if not exists replies (
  id text primary key,
  thread_id text not null references threads(id) on delete cascade,
  body text not null,
  author_alias text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  status text not null default 'published'
);

create table if not exists questions (
  id text primary key,
  question text not null,
  answer text,
  answer_status text not null default 'pending',
  sources jsonb not null default '[]'::jsonb,
  district_id text,
  state_id text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists representatives (
  id text primary key,
  name text not null,
  role text not null,
  constituency text not null,
  district_id text,
  state_id text not null,
  party text,
  official_contact text,
  official_source_url text not null,
  verification_status text not null default 'verified',
  last_verified_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists representatives_district_idx on representatives (district_id, role);

create table if not exists contact_messages (
  id text primary key,
  name text,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on contact_messages (status, created_at desc);

create table if not exists moderation_actions (
  id bigserial primary key,
  actor text not null default 'admin',
  action text not null,
  target_type text not null,
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists news_sources (
  id text primary key,
  name text not null,
  feed_url text not null,
  language text not null,
  scope text not null,
  enabled boolean not null default false,
  attribution text not null,
  terms_note text not null,
  last_fetched_at timestamptz
);
