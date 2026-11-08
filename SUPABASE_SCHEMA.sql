-- Run this in your Supabase project → SQL Editor

create table if not exists events (
  id             serial primary key,
  type           text    not null check (type in ('feeding', 'sleep', 'diaper', 'bath', 'vitamin_d', 'medication', 'solids', 'milestone')),
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  duration_minutes integer,
  amount_ml      integer,
  diaper_type    text    check (diaper_type in ('pee', 'poop', 'both')),
  ointment       boolean,
  food_type      text,
  foods          text[],
  reaction       text    check (reaction in ('loved', 'ok', 'disliked')),
  symptoms       text[],
  is_favorite    boolean not null default false,
  title          text,
  amount_tsp     numeric(4,1),
  notes          text,
  is_active      boolean not null default false,
  logged_by      text,
  created_at     timestamptz not null default now()
);

-- Only requests carrying the JWT issued by the verify-pin edge function (family PIN) get access
alter table events enable row level security;
create policy "Family access" on events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists events_started_at_idx on events (started_at desc);
create index if not exists events_type_idx on events (type);
create index if not exists events_is_active_idx on events (is_active) where is_active = true;

-- Per-person app preferences (keyed by the name chosen in "who is using this device")
create table if not exists person_prefs (
  name          text primary key,
  quick_actions text[] not null,
  updated_at    timestamptz not null default now()
);

alter table person_prefs enable row level security;
create policy "Family access" on person_prefs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
