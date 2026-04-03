create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  credits numeric not null,
  semester text not null,
  status text not null check (status in ('done', 'pending')),
  grade text,
  exam_date text,
  examiner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

alter table public.courses enable row level security;

drop policy if exists "users can read own courses" on public.courses;
create policy "users can read own courses"
on public.courses
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own courses" on public.courses;
create policy "users can insert own courses"
on public.courses
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update own courses" on public.courses;
create policy "users can update own courses"
on public.courses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own courses" on public.courses;
create policy "users can delete own courses"
on public.courses
for delete
using (auth.uid() = user_id);
