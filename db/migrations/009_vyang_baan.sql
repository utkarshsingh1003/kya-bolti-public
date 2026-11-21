-- Kya Bolti Public — migration 009
-- Vyang Baan content management table
-- Run once to create the vyang_baan table

create table vyang_baan (
  id text primary key,
  title_hi text not null,
  title_en text not null,
  body_hi text,
  body_en text,
  author_id text not null references users(id) on delete cascade,
  category text not null,
  status text not null,
  is_demo boolean not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Apply default values after table creation (required for Supabase PostgreSQL)
alter table vyang_baan alter column category set default 'vyang';
alter table vyang_baan alter column status set default 'draft';
alter table vyang_baan alter column is_demo set default false;
alter table vyang_baan alter column created_at set default now();
alter table vyang_baan alter column updated_at set default now();

create index if not exists vyang_baan_status_idx on vyang_baan (status, created_at desc);
create index if not exists vyang_baan_category_idx on vyang_baan (category, created_at desc);
