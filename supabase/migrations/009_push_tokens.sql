-- Device registrations for remote push notifications
create table if not exists public.push_tokens(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 expo_push_token text not null unique,
 platform text,
 device_name text,
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;
drop policy if exists "push tokens own read" on public.push_tokens;
create policy "push tokens own read" on public.push_tokens for select to authenticated using(user_id=auth.uid());
drop policy if exists "push tokens own insert" on public.push_tokens;
create policy "push tokens own insert" on public.push_tokens for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "push tokens own update" on public.push_tokens;
create policy "push tokens own update" on public.push_tokens for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "push tokens own delete" on public.push_tokens;
create policy "push tokens own delete" on public.push_tokens for delete to authenticated using(user_id=auth.uid());
