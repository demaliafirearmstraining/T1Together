-- Community V2 ownership policies
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated using(auth.uid()=author_id);

drop policy if exists "comments delete own" on public.post_comments;
create policy "comments delete own" on public.post_comments for delete to authenticated using(auth.uid()=author_id);
