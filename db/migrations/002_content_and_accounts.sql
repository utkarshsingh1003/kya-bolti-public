-- Kya Bolti Public — migration 002
-- Adds accounts, poll management, poll requests, public updates,
-- trending buzz posts and advertising inquiries.
-- Safe to run repeatedly: every statement is idempotent.

-- 001 may have been skipped or only partially applied (e.g. dashboard-created
-- `issues` without `polls`). CREATE TABLE IF NOT EXISTS is a no-op when present.
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

alter table issues add column if not exists pin text;

alter table polls add column if not exists status text not null default 'published';
alter table polls add column if not exists featured boolean not null default false;
alter table polls add column if not exists sponsored boolean not null default false;
alter table polls add column if not exists sponsor_label_hi text;
alter table polls add column if not exists sponsor_label_en text;

create index if not exists polls_status_idx on polls (status, created_at desc);

-- Ownership links keep "my submissions" private and server-enforced.
alter table issues add column if not exists owner_id text;
alter table reviews add column if not exists owner_id text;
alter table threads add column if not exists owner_id text;
alter table questions add column if not exists owner_id text;

create index if not exists issues_owner_idx on issues (owner_id, created_at desc);
create index if not exists reviews_owner_idx on reviews (owner_id, created_at desc);
create index if not exists threads_owner_idx on threads (owner_id, created_at desc);
create index if not exists questions_owner_idx on questions (owner_id, created_at desc);

create table if not exists users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  state_id text,
  district_id text,
  pin text,
  area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quiz_scores (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  quiz_slug text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quiz_slug)
);

create index if not exists quiz_scores_slug_idx on quiz_scores (quiz_slug, score desc);

create table if not exists poll_requests (
  id text primary key,
  question_hi text not null,
  question_en text not null,
  options_hi jsonb not null default '[]'::jsonb,
  options_en jsonb not null default '[]'::jsonb,
  category text not null,
  purpose text not null,
  contact text,
  state_id text not null,
  district_id text not null,
  status text not null default 'pending',
  admin_note text,
  created_poll_id text references polls(id) on delete set null,
  owner_id text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists poll_requests_status_idx on poll_requests (status, created_at desc);

create table if not exists announcements (
  id text primary key,
  title_hi text not null,
  title_en text not null,
  body_hi text not null,
  body_en text not null,
  category text not null default 'notice',
  state_id text,
  district_id text,
  source_label text,
  source_url text,
  image_url text,
  status text not null default 'draft',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_status_idx on announcements (status, publish_at desc);
create index if not exists announcements_locality_idx on announcements (state_id, district_id, publish_at desc);

create table if not exists buzz_posts (
  id text primary key,
  title_hi text not null,
  title_en text not null,
  summary_hi text not null,
  summary_en text not null,
  body_hi text not null default '',
  body_en text not null default '',
  category text not null default 'trending',
  platform text not null,
  source_url text,
  image_url text,
  status text not null default 'draft',
  origin text not null default 'admin',
  submitted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists buzz_posts_status_idx on buzz_posts (status, published_at desc);

create table if not exists ad_inquiries (
  id text primary key,
  advertiser_name text not null,
  email text not null,
  phone text not null,
  objective text not null,
  budget_range text not null,
  placement text not null,
  destination_url text not null,
  creative_url text,
  campaign_start timestamptz,
  campaign_end timestamptz,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_inquiries_status_idx on ad_inquiries (status, created_at desc);

-- ============================
-- Row Level Security (RLS) policies
-- These policies are safe to run; they deny anon access and allow service_role full access.
-- The application uses custom session auth (AUTH_SECRET), so anon access is blocked.
-- If Supabase Auth is later enabled, adjust policies accordingly.
-- ============================
-- Enable RLS on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_requests ENABLE ROW LEVEL SECURITY;

-- Deny all access to anon users (anonymous browser sessions)
CREATE POLICY "users_no_anon" ON users FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "ad_inquiries_no_anon" ON ad_inquiries FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "quiz_scores_no_anon" ON quiz_scores FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "poll_requests_no_anon" ON poll_requests FOR ALL TO anon USING (false) WITH CHECK (false);

-- Allow the Supabase service_role (server‑only) full access to these tables
CREATE POLICY "service_role_full_access_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_ad_inquiries" ON ad_inquiries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_quiz_scores" ON quiz_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_poll_requests" ON poll_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
