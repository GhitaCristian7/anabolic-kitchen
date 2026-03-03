-- Upgrade: Coach dashboard + Hybrid foods (OFF/custom)
-- Rulează în Supabase SQL Editor (după schema inițială).

-- 1) profiles: adaugă rolul de coach
alter table public.profiles
  add column if not exists is_coach boolean not null default false;

-- 2) helper: verifică dacă userul curent este coach
create or replace function public.is_coach(uid uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select coalesce((select p.is_coach from public.profiles p where p.user_id = uid), false);
$$;

-- 3) Foods master table (din API sau custom)
create table if not exists public.foods (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text not null,
  source text not null check (source in ('off','usda','custom')),
  external_id text null,
  owner_user_id uuid null references auth.users(id) on delete cascade,
  calories_per_100g numeric(8,2) not null check (calories_per_100g >= 0),
  protein_per_100g numeric(8,2) not null check (protein_per_100g >= 0),
  carbs_per_100g numeric(8,2) not null check (carbs_per_100g >= 0),
  fat_per_100g numeric(8,2) not null check (fat_per_100g >= 0),
  is_verified boolean not null default false
);

create index if not exists foods_owner_idx on public.foods(owner_user_id);
create index if not exists foods_name_idx on public.foods using gin (to_tsvector('simple', name));

-- 4) Food logs (ce a mâncat clientul, în grame)
create table if not exists public.food_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_type text not null check (meal_type in ('mic_dejun','pranz','cina','gustare')),
  food_id bigint not null references public.foods(id) on delete restrict,
  grams numeric(8,2) not null check (grams > 0 and grams <= 5000)
);

create index if not exists food_logs_user_date_idx on public.food_logs(user_id, log_date);
create index if not exists food_logs_food_idx on public.food_logs(food_id);

-- 5) RLS
alter table public.foods enable row level security;
alter table public.food_logs enable row level security;

-- Profiles: extinde read pentru coach
drop policy if exists "Profiles: user can read own" on public.profiles;
create policy "Profiles: user/coach can read" on public.profiles
for select using (auth.uid() = user_id or public.is_coach(auth.uid()));

drop policy if exists "Profiles: user can update own" on public.profiles;
create policy "Profiles: user can update own" on public.profiles
for update using (auth.uid() = user_id);

-- daily_logs: extinde read pentru coach
drop policy if exists "Logs: user can read own" on public.daily_logs;
create policy "Logs: user/coach can read" on public.daily_logs
for select using (auth.uid() = user_id or public.is_coach(auth.uid()));

-- foods: select
drop policy if exists "Foods: can read" on public.foods;
create policy "Foods: can read" on public.foods
for select using (
  auth.role() = 'authenticated'
  and (
    owner_user_id = auth.uid()
    or public.is_coach(auth.uid())
    or (is_verified = true and source in ('off','usda'))
  )
);

-- foods: insert/update/delete doar owner (custom)
drop policy if exists "Foods: user can insert own" on public.foods;
create policy "Foods: user can insert own" on public.foods
for insert with check (auth.uid() = owner_user_id);

drop policy if exists "Foods: user can update own" on public.foods;
create policy "Foods: user can update own" on public.foods
for update using (auth.uid() = owner_user_id);

drop policy if exists "Foods: user can delete own" on public.foods;
create policy "Foods: user can delete own" on public.foods
for delete using (auth.uid() = owner_user_id);

-- food_logs: user sau coach poate citi; doar user poate scrie
drop policy if exists "Food logs: user/coach can read" on public.food_logs;
create policy "Food logs: user/coach can read" on public.food_logs
for select using (auth.uid() = user_id or public.is_coach(auth.uid()));

drop policy if exists "Food logs: user can insert own" on public.food_logs;
create policy "Food logs: user can insert own" on public.food_logs
for insert with check (auth.uid() = user_id);

drop policy if exists "Food logs: user can update own" on public.food_logs;
create policy "Food logs: user can update own" on public.food_logs
for update using (auth.uid() = user_id);

drop policy if exists "Food logs: user can delete own" on public.food_logs;
create policy "Food logs: user can delete own" on public.food_logs
for delete using (auth.uid() = user_id);

-- 6) Exemplu: setează-ți contul ca coach (înlocuiește cu UUID-ul tău)
-- update public.profiles set is_coach = true where user_id = '00000000-0000-0000-0000-000000000000';
