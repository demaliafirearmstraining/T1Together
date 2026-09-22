-- Community V2: saved posts and ownership helpers
create table if not exists public.post_bookmarks(
 user_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,post_id)
);
alter table public.post_bookmarks enable row level security;
drop policy if exists "bookmarks own select" on public.post_bookmarks;
create policy "bookmarks own select" on public.post_bookmarks for select to authenticated using(user_id=auth.uid());
drop policy if exists "bookmarks own insert" on public.post_bookmarks;
create policy "bookmarks own insert" on public.post_bookmarks for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "bookmarks own delete" on public.post_bookmarks;
create policy "bookmarks own delete" on public.post_bookmarks for delete to authenticated using(user_id=auth.uid());

create or replace function public.community_post_stats()
returns table(post_id uuid,support_count bigint,comment_count bigint)
language sql stable security definer set search_path=public as $$
 select p.id,
 (select count(*) from post_reactions r where r.post_id=p.id),
 (select count(*) from post_comments c where c.post_id=p.id)
 from posts p;
$$;
revoke all on function public.community_post_stats() from public;
grant execute on function public.community_post_stats() to authenticated;
