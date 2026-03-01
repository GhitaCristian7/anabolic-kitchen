-- ANABOLIC KITCHEN / Supabase schema + RLS
-- 1) Rulează în Supabase SQL Editor
-- 2) Apoi rulează seed_recipes.sql (tot în SQL Editor)

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  sex text not null check (sex in ('M','F')),
  age int not null check (age between 14 and 90),
  height_cm int not null check (height_cm between 120 and 230),
  weight_kg numeric(5,2) not null check (weight_kg between 30 and 250),
  activity_level text not null check (activity_level in ('sedentary','light','moderate','active','very_active')),
  goal text not null check (goal in ('slabire','masa','mentinere')),
  calorie_target int not null,
  protein_target int not null,
  carbs_target int not null,
  fat_target int not null
);

create table if not exists public.recipes (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  title text not null,
  category text not null check (category in ('mic_dejun','pranz','cina','gustare')),
  cooking_time_min int not null check (cooking_time_min between 1 and 240),
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  ingredients jsonb not null,
  steps jsonb not null,
  image_url text null,
  is_active boolean not null default true
);

create table if not exists public.daily_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  recipe_id bigint not null references public.recipes(id) on delete restrict,
  portions numeric(4,2) not null default 1 check (portions > 0 and portions <= 10)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, log_date);
create index if not exists daily_logs_recipe_idx on public.daily_logs(recipe_id);

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.recipes enable row level security;

drop policy if exists "Profiles: user can read own" on public.profiles;
create policy "Profiles: user can read own" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "Profiles: user can insert own" on public.profiles;
create policy "Profiles: user can insert own" on public.profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Profiles: user can update own" on public.profiles;
create policy "Profiles: user can update own" on public.profiles for update using (auth.uid() = user_id);

drop policy if exists "Logs: user can read own" on public.daily_logs;
create policy "Logs: user can read own" on public.daily_logs for select using (auth.uid() = user_id);

drop policy if exists "Logs: user can insert own" on public.daily_logs;
create policy "Logs: user can insert own" on public.daily_logs for insert with check (auth.uid() = user_id);

drop policy if exists "Logs: user can update own" on public.daily_logs;
create policy "Logs: user can update own" on public.daily_logs for update using (auth.uid() = user_id);

drop policy if exists "Logs: user can delete own" on public.daily_logs;
create policy "Logs: user can delete own" on public.daily_logs for delete using (auth.uid() = user_id);

drop policy if exists "Recipes: authenticated can read active" on public.recipes;
create policy "Recipes: authenticated can read active" on public.recipes for select
using (auth.role() = 'authenticated' and is_active = true);

-- IMPORTANT: nu adăuga insert/update/delete policy pe recipes.
