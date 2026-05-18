-- ============================================================
-- Fallacy Forum — Supabase schema
-- Run this in the Supabase SQL Editor (or via psql) once.
-- ============================================================

-- Enable uuid generation
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- Lightweight profiles (no auth). Each daughter picks a profile.
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  avatar_emoji  text not null default '🎓',
  created_at    timestamptz not null default now()
);

-- ---------- sessions ----------
-- A practice OR test session.
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  mode          text not null check (mode in ('practice', 'test')),
  topic         text,                       -- user-provided debate topic / context
  difficulty    text not null check (difficulty in ('easy', 'medium', 'hard')),
  target_fallacy text,                       -- for practice mode: chosen fallacy slug; null for test
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  total_questions int not null default 0,
  correct_count   int not null default 0
);

create index if not exists sessions_profile_idx on sessions (profile_id, started_at desc);

-- ---------- attempts ----------
-- One row per question shown.
create table if not exists attempts (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  question_index  int not null,
  fallacy_slug    text not null,       -- ground-truth fallacy
  fallacy_name    text not null,
  argument_text   text not null,        -- the AI-generated crossfire snippet
  options         jsonb not null,       -- array of {slug, name} (4 options)
  selected_slug   text,                 -- what the user picked (null = not answered)
  is_correct      boolean,
  explanation     text,                 -- AI explanation of the fallacy
  answered_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists attempts_session_idx on attempts (session_id, question_index);
create index if not exists attempts_profile_fallacy_idx on attempts (profile_id, fallacy_slug);

-- ---------- Row Level Security (anon-key friendly) ----------
-- This app has no authentication. If you connect using the SERVICE_ROLE key,
-- RLS is bypassed and these policies are not needed. If you connect using the
-- ANON key (recommended — never put service role in env), these policies
-- allow read/write from anonymous clients.
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table attempts enable row level security;

create policy "anon read profiles" on profiles for select to anon using (true);
create policy "anon insert profiles" on profiles for insert to anon with check (true);
create policy "anon update profiles" on profiles for update to anon using (true) with check (true);
create policy "anon delete profiles" on profiles for delete to anon using (true);

create policy "anon read sessions" on sessions for select to anon using (true);
create policy "anon insert sessions" on sessions for insert to anon with check (true);
create policy "anon update sessions" on sessions for update to anon using (true) with check (true);
create policy "anon delete sessions" on sessions for delete to anon using (true);

create policy "anon read attempts" on attempts for select to anon using (true);
create policy "anon insert attempts" on attempts for insert to anon with check (true);
create policy "anon update attempts" on attempts for update to anon using (true) with check (true);

-- ---------- view: weak-area summary per profile ----------
create or replace view profile_fallacy_stats as
select
  profile_id,
  fallacy_slug,
  fallacy_name,
  count(*)                       as total_attempts,
  sum(case when is_correct then 1 else 0 end) as correct,
  round(
    100.0 * sum(case when is_correct then 1 else 0 end) / nullif(count(*), 0),
    1
  )                              as accuracy_pct
from attempts
where selected_slug is not null
group by profile_id, fallacy_slug, fallacy_name;
