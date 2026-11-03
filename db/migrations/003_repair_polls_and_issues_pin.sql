-- Repair schema drift on databases where 001/002 are already recorded as
-- applied but `polls` was never created and/or `issues` lacks `pin`.
-- Idempotent: does not drop tables or rewrite rows.

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

alter table polls add column if not exists status text not null default 'published';
alter table polls add column if not exists featured boolean not null default false;
alter table polls add column if not exists sponsored boolean not null default false;
alter table polls add column if not exists sponsor_label_hi text;
alter table polls add column if not exists sponsor_label_en text;

create index if not exists polls_status_idx on polls (status, created_at desc);

alter table issues add column if not exists pin text;
alter table issues add column if not exists owner_id text;

create index if not exists issues_district_idx on issues (district_id, created_at desc);
create index if not exists issues_status_idx on issues (status);
create index if not exists issues_owner_idx on issues (owner_id, created_at desc);
