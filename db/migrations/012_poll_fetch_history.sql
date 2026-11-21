-- Kya Bolti Public — migration 012
-- Adds poll_fetch_history table to track CRON fetch metrics and history.
--
-- Rules: additive only, idempotent, no data loss.
--        Do not modify or delete existing data or tables.

-- Create poll_fetch_history table
create table if not exists poll_fetch_history (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_fetched integer default 0,
  valid_polls integer default 0,
  duplicates integer default 0,
  rejected integer default 0,
  error_message text,
  ip_address inet,
  user_agent text,
  success boolean default true
);

-- Create index for chronological queries
create index if not exists idx_poll_fetch_history_provider
  on poll_fetch_history (provider_id, started_at desc);

create index if not exists idx_poll_fetch_history_started
  on poll_fetch_history (started_at desc);

-- Comment: tracks per-provider poll fetch metrics for audit and monitoring
comment on table poll_fetch_history is 'Tracks CRON fetch history per provider: records fetched, duplicates, rejections, errors, and timing.';

-- Rollback (manual, only if fetch history tracking is removed entirely):
-- drop index if exists idx_poll_fetch_history_provider;
-- drop index if exists idx_poll_fetch_history_started;
-- drop table if exists poll_fetch_history;
