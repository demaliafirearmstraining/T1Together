-- Fix Community reply INSERT RLS by validating the parent comment through
-- a narrowly scoped SECURITY DEFINER helper instead of querying post_comments
-- recursively inside the post_comments policy.

create or replace function public.parent_comment_matches_post(parent_id uuid, target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
 select parent_id is null
    or exists(
      select 1
      from public.post_comments c
      where c.id=parent_id
        and c.post_id=target_post_id
    );
$$;

revoke all on function public.parent_comment_matches_post(uuid,uuid) from public;
grant execute on function public.parent_comment_matches_post(uuid,uuid) to authenticated;

drop policy if exists "comments insert own" on public.post_comments;
create policy "comments insert own" on public.post_comments
for insert to authenticated
with check(
 author_id=auth.uid()
 and public.parent_comment_matches_post(parent_comment_id,post_id)
);
