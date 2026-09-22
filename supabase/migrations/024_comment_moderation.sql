-- Community V2 comment moderation
drop policy if exists "comments delete own" on public.post_comments;
drop policy if exists "comments delete own or post owner" on public.post_comments;
create policy "comments delete own or post owner"
on public.post_comments
for delete
to authenticated
using(
  author_id = auth.uid()
  or exists(
    select 1
    from public.posts p
    where p.id = post_comments.post_id
      and p.author_id = auth.uid()
  )
);
