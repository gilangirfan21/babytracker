-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: tables use `if not exists`, policies are dropped and
-- recreated so tweaking this script and running it again won't error out.

create extension if not exists pgcrypto;

-- Renames the table in place if it was already created as `profiles` by an
-- earlier run of this script; no-op otherwise.
alter table if exists profiles rename to profile_baby;

create table if not exists profile_baby (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hpht date not null,
  baby_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  gestational_week integer not null,
  measurement_date date not null,
  fetal_sex text default 'unknown',
  weight_grams numeric,
  head_circumference_mm numeric,
  abdominal_circumference_mm numeric,
  femur_length_mm numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table profile_baby enable row level security;
alter table measurements enable row level security;

drop policy if exists "profiles_select_own" on profile_baby;
drop policy if exists "profile_baby_select_own" on profile_baby;
create policy "profile_baby_select_own" on profile_baby
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on profile_baby;
drop policy if exists "profile_baby_insert_own" on profile_baby;
create policy "profile_baby_insert_own" on profile_baby
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on profile_baby;
drop policy if exists "profile_baby_update_own" on profile_baby;
create policy "profile_baby_update_own" on profile_baby
  for update using (auth.uid() = user_id);

drop policy if exists "measurements_select_own" on measurements;
create policy "measurements_select_own" on measurements
  for select using (auth.uid() = user_id);

drop policy if exists "measurements_insert_own" on measurements;
create policy "measurements_insert_own" on measurements
  for insert with check (auth.uid() = user_id);

drop policy if exists "measurements_update_own" on measurements;
create policy "measurements_update_own" on measurements
  for update using (auth.uid() = user_id);

drop policy if exists "measurements_delete_own" on measurements;
create policy "measurements_delete_own" on measurements
  for delete using (auth.uid() = user_id);
