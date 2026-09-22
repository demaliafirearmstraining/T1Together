-- Final pre-release security hardening.
-- Keep user media scoped to its owner for writes, make avatar reads authenticated,
-- and close EXECUTE on SECURITY DEFINER helpers that were created before the
-- production-hardening passes.

-- Avatars are displayed only inside the signed-in T1Together experience. The bucket
-- can remain public for existing avatar_url compatibility, but Storage API reads are
-- no longer granted to the anonymous database role.
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar authenticated read" on storage.objects
for select to authenticated using(bucket_id='avatars');

-- Community images are private and authenticated-only. Re-state all ownership
-- policies here so a fresh production database ends with the intended policy set.
drop policy if exists "community photo authenticated read" on storage.objects;
create policy "community photo authenticated read" on storage.objects
for select to authenticated using(bucket_id='community-posts');

drop policy if exists "community photo own insert" on storage.objects;
create policy "community photo own insert" on storage.objects
for insert to authenticated
with check(bucket_id='community-posts' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "community photo own delete" on storage.objects;
create policy "community photo own delete" on storage.objects
for delete to authenticated
using(bucket_id='community-posts' and (storage.foldername(name))[1]=auth.uid()::text);

-- Older SECURITY DEFINER helpers were correctly auth-scoped when introduced, but
-- explicitly revoke PUBLIC again at the end of the migration chain so later schema
-- changes cannot leave implicit execute access behind.
revoke all on function public.users_blocked(uuid,uuid) from public;
grant execute on function public.users_blocked(uuid,uuid) to authenticated;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
revoke all on function public.my_unread_conversations() from public;
grant execute on function public.my_unread_conversations() to authenticated;
revoke all on function public.delete_my_app_data() from public;
grant execute on function public.delete_my_app_data() to authenticated;

-- Trigger entry points are never client APIs.
revoke all on function public.handle_new_user() from public;
