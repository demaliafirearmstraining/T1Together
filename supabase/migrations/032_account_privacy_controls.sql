-- Account & privacy controls.
-- A user can erase their T1Together application data while keeping the Auth account
-- long enough for the app to sign out cleanly. Full Auth deletion is handled by the
-- delete-account Edge Function below.

create or replace function public.delete_my_app_data()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Not authenticated'; end if;

 -- Remove storage objects owned by this user. Storage metadata deletion also removes
 -- the underlying object through Supabase Storage.
 delete from storage.objects
 where bucket_id in ('avatars','community-posts')
   and (storage.foldername(name))[1]=uid::text;

 -- The profile is the root of T1Together user data. Existing ON DELETE CASCADE
 -- relationships remove posts, comments/reactions, help activity, supply posts,
 -- locations, tokens, blocks and conversation memberships that reference it.
 delete from public.profiles where id=uid;
end;
$$;
revoke all on function public.delete_my_app_data() from public;
grant execute on function public.delete_my_app_data() to authenticated;
