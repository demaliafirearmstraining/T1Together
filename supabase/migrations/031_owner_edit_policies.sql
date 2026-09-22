-- Allow owners to edit their own Community posts and Supply Locker posts.
-- Help requests already have an owner-only update policy.
drop policy if exists "posts update own" on public.posts;
create policy "posts update own" on public.posts
for update to authenticated
using(author_id=auth.uid())
with check(author_id=auth.uid());

drop policy if exists "supply posts update own" on public.supply_posts;
create policy "supply posts update own" on public.supply_posts
for update to authenticated
using(owner_id=auth.uid())
with check(owner_id=auth.uid());
