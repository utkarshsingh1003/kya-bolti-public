-- Kya Bolti Public — migration 007
-- Forward-only reconciliation for databases whose schema was created by an
-- older/dashboard shape (missing tables, columns, constraints and RLS).
--
-- Safety rules:
--  * Idempotent: every statement is guarded by existence checks.
--  * Transactional: the runner wraps this file in one transaction; nothing here
--    commits, rolls back or runs concurrently.
--  * Never drops tables, columns or primary keys, and never rewrites rows.
--  * Type conversions are guarded and validated; conversions that can lose
--    information require an empty table and abort otherwise.
--  * Legacy NOT NULL columns that the application never writes are relaxed to
--    NULL (columns and data are kept) so inserts cannot fail.
--  * Constraints are added NOT VALID and validated only when no violations or
--    orphans exist; otherwise the migration aborts with an explicit error.

-- ---------------------------------------------------------------------------
-- 1. Missing tables
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id text primary key,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists replies (
  id text primary key,
  thread_id text not null references threads(id) on delete cascade,
  body text not null,
  author_alias text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  status text not null default 'published'
);

-- ---------------------------------------------------------------------------
-- 2. Missing columns (canonical definitions from 001/002)
-- ---------------------------------------------------------------------------
do $$
declare
  expected record;
  existing_rows bigint;
begin
  for expected in
    select *
    from (values
      ('ad_inquiries', 'admin_note', $def$text$def$),
      ('ad_inquiries', 'campaign_end', $def$timestamptz$def$),
      ('ad_inquiries', 'campaign_start', $def$timestamptz$def$),
      ('ad_inquiries', 'updated_at', $def$timestamptz not null default now()$def$),
      ('announcements', 'created_at', $def$timestamptz not null default now()$def$),
      ('announcements', 'updated_at', $def$timestamptz not null default now()$def$),
      ('buzz_posts', 'published_at', $def$timestamptz$def$),
      ('buzz_posts', 'submitted_by', $def$text$def$),
      ('buzz_posts', 'updated_at', $def$timestamptz not null default now()$def$),
      ('contact_messages', 'status', $def$text not null default 'open'$def$),
      ('contact_messages', 'subject', $def$text not null$def$),
      ('issues', 'events', $def$jsonb not null default '[]'::jsonb$def$),
      ('issues', 'official_complaint_url', $def$text$def$),
      ('issues', 'updated_at', $def$timestamptz not null default now()$def$),
      ('moderation_actions', 'action', $def$text not null$def$),
      ('moderation_actions', 'actor', $def$text not null default 'admin'$def$),
      ('moderation_actions', 'note', $def$text$def$),
      ('news_sources', 'attribution', $def$text not null$def$),
      ('news_sources', 'enabled', $def$boolean not null default false$def$),
      ('news_sources', 'feed_url', $def$text not null$def$),
      ('news_sources', 'language', $def$text not null$def$),
      ('news_sources', 'last_fetched_at', $def$timestamptz$def$),
      ('news_sources', 'scope', $def$text not null$def$),
      ('news_sources', 'terms_note', $def$text not null$def$),
      ('poll_requests', 'updated_at', $def$timestamptz not null default now()$def$),
      ('questions', 'answer', $def$text$def$),
      ('questions', 'answer_status', $def$text not null default 'pending'$def$),
      ('questions', 'district_id', $def$text$def$),
      ('questions', 'is_demo', $def$boolean not null default false$def$),
      ('questions', 'question', $def$text not null$def$),
      ('questions', 'sources', $def$jsonb not null default '[]'::jsonb$def$),
      ('questions', 'state_id', $def$text$def$),
      ('quiz_scores', 'created_at', $def$timestamptz not null default now()$def$),
      ('quiz_scores', 'updated_at', $def$timestamptz not null default now()$def$),
      ('replies', 'author_alias', $def$text not null$def$),
      ('replies', 'body', $def$text not null$def$),
      ('replies', 'created_at', $def$timestamptz not null default now()$def$),
      ('replies', 'id', $def$text not null$def$),
      ('replies', 'is_demo', $def$boolean not null default false$def$),
      ('replies', 'status', $def$text not null default 'published'$def$),
      ('replies', 'thread_id', $def$text not null$def$),
      ('reports', 'created_at', $def$timestamptz not null default now()$def$),
      ('reports', 'details', $def$text$def$),
      ('reports', 'id', $def$text not null$def$),
      ('reports', 'reason', $def$text not null$def$),
      ('reports', 'status', $def$text not null default 'open'$def$),
      ('reports', 'target_id', $def$text not null$def$),
      ('reports', 'target_type', $def$text not null$def$),
      ('representatives', 'district_id', $def$text$def$),
      ('representatives', 'last_verified_at', $def$timestamptz not null$def$),
      ('representatives', 'name', $def$text not null$def$),
      ('representatives', 'official_contact', $def$text$def$),
      ('representatives', 'official_source_url', $def$text not null$def$),
      ('representatives', 'role', $def$text not null$def$),
      ('representatives', 'state_id', $def$text not null$def$),
      ('representatives', 'updated_at', $def$timestamptz not null default now()$def$),
      ('representatives', 'verification_status', $def$text not null default 'verified'$def$),
      ('reviews', 'area', $def$text not null$def$),
      ('reviews', 'body', $def$text not null$def$),
      ('reviews', 'display_name', $def$text$def$),
      ('reviews', 'district_id', $def$text not null$def$),
      ('reviews', 'is_demo', $def$boolean not null default false$def$),
      ('reviews', 'service_category', $def$text not null$def$),
      ('reviews', 'state_id', $def$text not null$def$),
      ('reviews', 'status', $def$text not null default 'published'$def$),
      ('schema_migrations', 'checksum', $def$text$def$),
      ('threads', 'author_alias', $def$text not null$def$),
      ('threads', 'body', $def$text not null$def$),
      ('threads', 'category', $def$text not null$def$),
      ('threads', 'district_id', $def$text not null$def$),
      ('threads', 'is_demo', $def$boolean not null default false$def$),
      ('threads', 'reply_count', $def$integer not null default 0$def$),
      ('threads', 'state_id', $def$text not null$def$),
      ('threads', 'status', $def$text not null default 'published'$def$),
      ('users', 'updated_at', $def$timestamptz not null default now()$def$)
    ) as expected_columns(table_name, column_name, column_definition)
  loop
    if to_regclass(format('public.%I', expected.table_name)) is null then
      continue;
    end if;

    -- A NOT NULL column without a default cannot be added to a populated table
    -- without inventing data. Abort instead of silently dropping rows.
    if expected.column_definition like '%not null%'
       and expected.column_definition not like '%default%'
       and not exists (
         select 1
         from information_schema.columns c
         where c.table_schema = 'public'
           and c.table_name = expected.table_name
           and c.column_name = expected.column_name
       ) then
      execute format('select count(*) from public.%I', expected.table_name) into existing_rows;
      if existing_rows > 0 then
        raise exception
          'KBP 007: cannot add %.% NOT NULL without default to a table with % row(s); backfill first',
          expected.table_name, expected.column_name, existing_rows;
      end if;
    end if;

    execute format(
      'alter table public.%I add column if not exists %I %s',
      expected.table_name,
      expected.column_name,
      expected.column_definition
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Guarded type conversions (validate data; abort on incompatible values)
-- ---------------------------------------------------------------------------
do $$
declare
  existing_rows bigint;
begin
  if to_regclass('public.poll_requests') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'poll_requests'
        and column_name = 'options_hi' and data_type in ('text', 'character varying')
    ) then
      execute 'alter table public.poll_requests alter column options_hi drop default';
      begin
        execute $q$alter table public.poll_requests alter column options_hi type jsonb
          using case when options_hi is null or btrim(options_hi) = '' then '[]'::jsonb
                     else options_hi::jsonb end$q$;
      exception when others then
        raise exception 'KBP 007: poll_requests.options_hi is not valid JSON (%). Conversion aborted.', sqlerrm;
      end;
      execute $q$alter table public.poll_requests alter column options_hi set default '[]'::jsonb$q$;
      execute 'alter table public.poll_requests alter column options_hi set not null';
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'poll_requests'
        and column_name = 'options_en' and data_type in ('text', 'character varying')
    ) then
      execute 'alter table public.poll_requests alter column options_en drop default';
      begin
        execute $q$alter table public.poll_requests alter column options_en type jsonb
          using case when options_en is null or btrim(options_en) = '' then '[]'::jsonb
                     else options_en::jsonb end$q$;
      exception when others then
        raise exception 'KBP 007: poll_requests.options_en is not valid JSON (%). Conversion aborted.', sqlerrm;
      end;
      execute $q$alter table public.poll_requests alter column options_en set default '[]'::jsonb$q$;
      execute 'alter table public.poll_requests alter column options_en set not null';
    end if;
  end if;

  -- quiz_scores.id: bigint -> text. Information-preserving only for empty
  -- tables; the primary key index is rebuilt in place, never dropped.
  if to_regclass('public.quiz_scores') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quiz_scores'
         and column_name = 'id' and data_type = 'bigint'
     ) then
    select count(*) into existing_rows from public.quiz_scores;
    if existing_rows > 0 then
      raise exception
        'KBP 007: quiz_scores.id conversion requires empty table (% rows); aborting to preserve data',
        existing_rows;
    end if;
    execute 'alter table public.quiz_scores alter column id drop default';
    execute 'alter table public.quiz_scores alter column id type text using id::text';
  end if;

  -- moderation_actions.id: text -> bigint identity (canonical bigserial).
  if to_regclass('public.moderation_actions') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'moderation_actions'
         and column_name = 'id' and data_type in ('text', 'character varying')
     ) then
    select count(*) into existing_rows from public.moderation_actions;
    if existing_rows > 0 then
      raise exception
        'KBP 007: moderation_actions.id conversion requires empty table (% rows); aborting to preserve data',
        existing_rows;
    end if;
    execute 'alter table public.moderation_actions alter column id type bigint using id::bigint';
    execute 'create sequence if not exists public.moderation_actions_id_seq';
    execute $q$alter table public.moderation_actions alter column id
      set default nextval('public.moderation_actions_id_seq'::regclass)$q$;
    execute 'alter sequence public.moderation_actions_id_seq owned by public.moderation_actions.id';
  end if;

  -- users.password_hash must be NOT NULL once no null rows exist.
  if to_regclass('public.users') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'users'
         and column_name = 'password_hash' and is_nullable = 'YES'
     ) then
    select count(*) into existing_rows from public.users where password_hash is null;
    if existing_rows > 0 then
      raise exception
        'KBP 007: users.password_hash has % null row(s); backfill before enforcing NOT NULL',
        existing_rows;
    end if;
    execute 'alter table public.users alter column password_hash set not null';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Legacy NOT NULL columns the application never writes: relax to NULL.
--    Columns and any existing data are preserved; inserts stop being blocked.
-- ---------------------------------------------------------------------------
do $$
declare
  legacy record;
begin
  for legacy in
    select * from (values
      ('questions', 'title'),
      ('questions', 'content'),
      ('reviews', 'content'),
      ('threads', 'content'),
      ('news_sources', 'url'),
      ('moderation_actions', 'action_type')
    ) as legacy_columns(table_name, column_name)
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = legacy.table_name
        and column_name = legacy.column_name
        and is_nullable = 'NO'
    ) then
      execute format(
        'alter table public.%I alter column %I drop not null',
        legacy.table_name,
        legacy.column_name
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. CHECK constraints (add NOT VALID, validate only when clean)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.reviews') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'reviews_rating_check' and conrelid = 'public.reviews'::regclass
    ) then
      alter table public.reviews
        add constraint reviews_rating_check check (rating between 1 and 5) not valid;
    end if;
    if exists (
      select 1 from pg_constraint
      where conname = 'reviews_rating_check' and conrelid = 'public.reviews'::regclass
        and not convalidated
    ) then
      if exists (select 1 from public.reviews where rating is not null and (rating < 1 or rating > 5)) then
        raise exception 'KBP 007: reviews.rating has out-of-range rows; refusing to validate constraint';
      end if;
      alter table public.reviews validate constraint reviews_rating_check;
    end if;
  end if;

  if to_regclass('public.quiz_scores') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'quiz_scores_score_check' and conrelid = 'public.quiz_scores'::regclass
    ) then
      alter table public.quiz_scores
        add constraint quiz_scores_score_check check (score >= 0) not valid;
    end if;
    if exists (
      select 1 from pg_constraint
      where conname = 'quiz_scores_score_check' and conrelid = 'public.quiz_scores'::regclass
        and not convalidated
    ) then
      if exists (select 1 from public.quiz_scores where score < 0) then
        raise exception 'KBP 007: quiz_scores.score has negative rows; refusing to validate constraint';
      end if;
      alter table public.quiz_scores validate constraint quiz_scores_score_check;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'quiz_scores_check' and conrelid = 'public.quiz_scores'::regclass
    ) then
      alter table public.quiz_scores
        add constraint quiz_scores_check check (total > 0 and score <= total) not valid;
    end if;
    if exists (
      select 1 from pg_constraint
      where conname = 'quiz_scores_check' and conrelid = 'public.quiz_scores'::regclass
        and not convalidated
    ) then
      if exists (select 1 from public.quiz_scores where total <= 0 or score > total) then
        raise exception 'KBP 007: quiz_scores has invalid score/total rows; refusing to validate constraint';
      end if;
      alter table public.quiz_scores validate constraint quiz_scores_check;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. UNIQUE constraints (only when no equivalent constraint exists)
-- ---------------------------------------------------------------------------
do $$
declare
  spec record;
begin
  for spec in
    select * from (values
      ('issues', 'issues_tracking_code_key', array['tracking_code']),
      ('users', 'users_email_key', array['email']),
      ('poll_votes', 'poll_votes_poll_id_voter_hash_key', array['poll_id', 'voter_hash']),
      ('quiz_scores', 'quiz_scores_user_id_quiz_slug_key', array['user_id', 'quiz_slug'])
    ) as uniques(table_name, constraint_name, columns)
  loop
    if to_regclass(format('public.%I', spec.table_name)) is null then
      continue;
    end if;
    if not exists (
      select 1
      from pg_constraint c
      where c.conrelid = to_regclass(format('public.%I', spec.table_name))
        and c.contype in ('p', 'u')
        and (
          select array_agg(a.attname::text order by a.attname)
          from pg_attribute a
          where a.attrelid = c.conrelid and a.attnum = any(c.conkey)
        ) = (
          select array_agg(x order by x) from unnest(spec.columns) as x
        )
    ) then
      execute format(
        'alter table public.%I add constraint %I unique (%s)',
        spec.table_name,
        spec.constraint_name,
        (select string_agg(quote_ident(x), ', ') from unnest(spec.columns) as x)
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Foreign keys (add NOT VALID, validate only when orphan-free)
-- ---------------------------------------------------------------------------
do $$
declare
  spec record;
  orphans bigint;
begin
  -- replies.thread_id -> threads(id)
  if to_regclass('public.replies') is not null
     and to_regclass('public.threads') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'replies_thread_id_fkey'
        and conrelid = 'public.replies'::regclass
    ) and not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.replies'::regclass
        and c.contype = 'f' and c.confrelid = 'public.threads'::regclass
    ) then
      alter table public.replies
        add constraint replies_thread_id_fkey foreign key (thread_id)
        references public.threads(id) on delete cascade not valid;
    end if;
    if exists (
      select 1 from pg_constraint
      where conname = 'replies_thread_id_fkey'
        and conrelid = 'public.replies'::regclass and not convalidated
    ) then
      select count(*) into orphans from public.replies r
      where not exists (select 1 from public.threads t where t.id = r.thread_id);
      if orphans > 0 then
        raise exception 'KBP 007: % orphaned replies.thread_id row(s); refusing to validate FK', orphans;
      end if;
      alter table public.replies validate constraint replies_thread_id_fkey;
    end if;
  end if;

  -- owner_id -> users(id)
  for spec in
    select * from (values
      ('issues', 'issues_owner_id_fkey'),
      ('reviews', 'reviews_owner_id_fkey'),
      ('threads', 'threads_owner_id_fkey'),
      ('questions', 'questions_owner_id_fkey')
    ) as owner_fks(table_name, constraint_name)
  loop
    if to_regclass(format('public.%I', spec.table_name)) is null
       or to_regclass('public.users') is null then
      continue;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = spec.table_name and column_name = 'owner_id'
    ) then
      continue;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = spec.constraint_name
        and conrelid = to_regclass(format('public.%I', spec.table_name))
    ) and not exists (
      select 1 from pg_constraint c
      where c.conrelid = to_regclass(format('public.%I', spec.table_name))
        and c.contype = 'f' and c.confrelid = 'public.users'::regclass
        and exists (
          select 1 from pg_attribute a
          where a.attrelid = c.conrelid and a.attnum = any(c.conkey) and a.attname = 'owner_id'
        )
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (owner_id) references public.users(id) on delete set null not valid',
        spec.table_name,
        spec.constraint_name
      );
    end if;

    if exists (
      select 1 from pg_constraint
      where conname = spec.constraint_name
        and conrelid = to_regclass(format('public.%I', spec.table_name))
        and not convalidated
    ) then
      execute format(
        'select count(*) from public.%I t where t.owner_id is not null and not exists (select 1 from public.users u where u.id = t.owner_id)',
        spec.table_name
      ) into orphans;
      if orphans > 0 then
        raise exception 'KBP 007: % orphaned owner_id row(s) in %; refusing to validate FK', orphans, spec.table_name;
      end if;
      execute format(
        'alter table public.%I validate constraint %I',
        spec.table_name,
        spec.constraint_name
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Indexes (canonical set)
-- ---------------------------------------------------------------------------
create index if not exists issues_district_idx on issues (district_id, created_at desc);
create index if not exists issues_status_idx on issues (status);
create index if not exists issues_owner_idx on issues (owner_id, created_at desc);
create index if not exists reviews_district_idx on reviews (district_id, created_at desc);
create index if not exists reviews_owner_idx on reviews (owner_id, created_at desc);
create index if not exists threads_district_idx on threads (district_id, created_at desc);
create index if not exists threads_owner_idx on threads (owner_id, created_at desc);
create index if not exists questions_owner_idx on questions (owner_id, created_at desc);
create index if not exists representatives_district_idx on representatives (district_id, role);
create index if not exists contact_messages_status_idx on contact_messages (status, created_at desc);
create index if not exists polls_status_idx on polls (status, created_at desc);
create index if not exists quiz_scores_slug_idx on quiz_scores (quiz_slug, score desc);
create index if not exists poll_requests_status_idx on poll_requests (status, created_at desc);
create index if not exists announcements_status_idx on announcements (status, publish_at desc);
create index if not exists announcements_locality_idx on announcements (state_id, district_id, publish_at desc);
create index if not exists buzz_posts_status_idx on buzz_posts (status, published_at desc);
create index if not exists ad_inquiries_status_idx on ad_inquiries (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 9. RLS: enable on app tables and close the anonymous PostgREST surface.
--    Idempotent with 002/005 policy names; no FORCE ROW LEVEL SECURITY.
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
  actor text := current_user;
  actor_bypasses boolean := false;
  owns_table boolean := false;
  app_tables text[] := array[
    'polls', 'poll_options', 'poll_votes', 'issues', 'reviews', 'threads',
    'replies', 'questions', 'reports', 'representatives', 'contact_messages',
    'users', 'quiz_scores', 'poll_requests', 'announcements', 'buzz_posts',
    'ad_inquiries', 'news_sources', 'moderation_actions'
  ];
begin
  if not exists (select 1 from pg_roles where rolname = 'anon')
     and not exists (select 1 from pg_roles where rolname = 'service_role') then
    return;
  end if;

  if actor in ('anon', 'authenticated') then
    raise exception 'KBP 007: current_user is %; refusing to enable RLS', actor;
  end if;

  select coalesce(bool_or(rolsuper or rolbypassrls), false)
  into actor_bypasses
  from pg_roles
  where rolname = actor;

  foreach tbl in array app_tables loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    select exists (
      select 1
      from pg_class c
      join pg_roles r on r.oid = c.relowner
      where c.oid = to_regclass(format('public.%I', tbl))
        and r.rolname = actor
    ) into owns_table;

    if not owns_table and not actor_bypasses then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', tbl);

    if exists (select 1 from pg_roles where rolname = 'anon')
       and not exists (
         select 1 from pg_policies
         where schemaname = 'public' and tablename = tbl
           and policyname::text in (tbl || '_no_anon', tbl || '_anon_deny')
       ) then
      execute format(
        'create policy %I on public.%I for all to anon using (false) with check (false)',
        tbl || '_anon_deny', tbl
      );
    end if;

    if exists (select 1 from pg_roles where rolname = 'service_role')
       and not exists (
         select 1 from pg_policies
         where schemaname = 'public' and tablename = tbl
           and 'service_role'::name = any(roles) and cmd = 'ALL'
       ) then
      execute format(
        'create policy %I on public.%I for all to service_role using (true) with check (true)',
        tbl || '_service_all', tbl
      );
    end if;
  end loop;

  if to_regclass('public.schema_migrations') is not null then
    select exists (
      select 1
      from pg_class c
      join pg_roles r on r.oid = c.relowner
      where c.oid = to_regclass('public.schema_migrations')
        and r.rolname = actor
    ) into owns_table;

    if owns_table or actor_bypasses then
      execute 'alter table public.schema_migrations enable row level security';
      if exists (select 1 from pg_roles where rolname = 'anon') then
        execute 'revoke all on table public.schema_migrations from anon';
      end if;
      if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'revoke all on table public.schema_migrations from authenticated';
      end if;
    end if;
  end if;
end $$;
