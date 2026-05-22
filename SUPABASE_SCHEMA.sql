-- Run this in your Supabase project → SQL Editor

create table if not exists events (
  id             serial primary key,
  type           text    not null check (type in ('feeding', 'sleep', 'diaper')),
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  duration_minutes integer,
  amount_ml      integer,
  diaper_type    text    check (diaper_type in ('pee', 'poop', 'both')),
  notes          text,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Allow all operations from the browser (anon key) — the PIN protects access at the app level
alter table events enable row level security;
create policy "Allow all" on events for all using (true) with check (true);

create index if not exists events_started_at_idx on events (started_at desc);
create index if not exists events_type_idx on events (type);
create index if not exists events_is_active_idx on events (is_active) where is_active = true;
