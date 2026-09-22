-- Production hardening pass 2
-- Close direct approximate-location reads, enforce public Nearby discovery server-side,
-- and tighten execution rights on sensitive helper functions.

-- Approximate location buckets are internal matching data. Clients may only write/update
-- their own row; discovery happens through RPCs that return distance bands, never coordinates.
drop policy if exists "location community read" on public.approximate_locations;
drop policy if exists "location own" on public.approximate_locations;
drop policy if exists "approx location own read" on public.approximate_locations;
drop policy if exists "approx location own insert" on public.approximate_locations;
drop policy if exists "approx location own update" on public.approximate_locations;
drop policy if exists "approx location own delete" on public.approximate_locations;

create policy "approx location own insert" on public.approximate_locations
for insert to authenticated with check(user_id=auth.uid());
create policy "approx location own update" on public.approximate_locations
for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Nearby must enforce discoverability in the database rather than relying on UI filtering.
create or replace function public.my_nearby_members(max_miles double precision default 25)
returns table(member_id uuid,distance_band text)
language sql stable security definer set search_path=public as $$
 with me as(
   select latitude_bucket lat,longitude_bucket lng
   from public.approximate_locations where user_id=auth.uid() limit 1
 ),
 d as(
   select a.user_id,
          public.distance_miles(me.lat,me.lng,a.latitude_bucket,a.longitude_bucket) miles
   from public.approximate_locations a cross join me
   where a.user_id<>auth.uid()
 )
 select d.user_id,
   case when miles<5 then 'Within about 5 miles'
        when miles<15 then 'Within about 15 miles'
        else 'Within about 25 miles' end
 from d
 join public.profiles p on p.id=d.user_id
 where miles<=least(greatest(coalesce(max_miles,25),1),25)
   and p.is_public=true
   and not public.users_blocked(auth.uid(),d.user_id)
 order by miles;
$$;

-- Explicit execution boundaries for discovery/messaging/security helpers.
revoke all on function public.my_nearby_members(double precision) from public;
grant execute on function public.my_nearby_members(double precision) to authenticated;

revoke all on function public.search_nearby_public_members(integer,text,text,text,text,text,text,boolean) from public;
grant execute on function public.search_nearby_public_members(integer,text,text,text,text,text,text,boolean) to authenticated;

revoke all on function public.start_conversation(uuid) from public;
grant execute on function public.start_conversation(uuid) to authenticated;

revoke all on function public.can_message(uuid) from public;
grant execute on function public.can_message(uuid) to authenticated;

revoke all on function public.my_blocked_members() from public;
grant execute on function public.my_blocked_members() to authenticated;

revoke all on function public.set_my_approximate_location(double precision,double precision) from public;
grant execute on function public.set_my_approximate_location(double precision,double precision) to authenticated;

revoke all on function public.help_response_counts() from public;
grant execute on function public.help_response_counts() to authenticated;

-- Internal trigger functions should never be client-callable.
revoke all on function public.handle_new_user() from public;
revoke all on function public.notify_help_response() from public;
revoke all on function public.notify_message_push() from public;
revoke all on function public.queue_notification_push() from public;
