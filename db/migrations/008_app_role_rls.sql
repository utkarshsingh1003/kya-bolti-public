-- Kya Bolti Public — migration 008
-- Least-privilege application role: grants and RLS policies for `kbp_app`.
--
-- The role itself is provisioned out-of-band by `scripts/provision-app-role.mjs`
-- because it owns a password and must never be committed to migration history.
-- This migration is safe to run before or after the role exists: every grant,
-- policy and default-privilege statement is skipped when the role is absent.
--
-- The application never owns tables, so RLS always applies. The dedicated
-- policies below allow the application role to read and write application data
-- while `anon` stays denied and migration metadata stays unreadable.

do $$
declare
  app_role text := 'kbp_app';
  tbl text;
  app_tables text[] := array[
    'polls', 'poll_options', 'poll_votes', 'issues', 'reviews', 'threads',
    'replies', 'questions', 'reports', 'representatives', 'contact_messages',
    'users', 'quiz_scores', 'poll_requests', 'announcements', 'buzz_posts',
    'ad_inquiries', 'news_sources', 'moderation_actions'
  ];
begin
  if not exists (select 1 from pg_roles where rolname = app_role) then
    raise notice 'KBP 008: role % is absent; skipping grants and policies', app_role;
    return;
  end if;

  execute format('grant connect on database %I to %I', current_database(), app_role);
  execute format('grant usage on schema public to %I', app_role);

  -- Start from a clean ACL, then grant only the DML surface the app needs.
  execute format('revoke all on all tables in schema public from %I', app_role);
  execute format(
    'grant select, insert, update, delete on all tables in schema public to %I',
    app_role
  );
  execute format('grant usage, select on all sequences in schema public to %I', app_role);

  -- Future tables/sequences created by this role follow the same least privilege.
  execute format(
    'alter default privileges in schema public grant select, insert, update, delete on tables to %I',
    app_role
  );
  execute format(
    'alter default privileges in schema public grant usage, select on sequences to %I',
    app_role
  );

  -- Migration metadata is runner-only.
  if to_regclass('public.schema_migrations') is not null then
    execute format('revoke all on table public.schema_migrations from %I', app_role);
  end if;

  foreach tbl in array app_tables loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', tbl);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_kbp_app_allow'
    ) then
      execute format(
        'create policy %I on public.%I for all to %I using (true) with check (true)',
        tbl || '_kbp_app_allow',
        tbl,
        app_role
      );
    end if;
  end loop;
end $$;
