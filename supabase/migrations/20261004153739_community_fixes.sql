-- Separate unread counts using the caller's existing notification RLS.
create or replace function public.my_unread_notification_counts()
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'community',count(*) filter(where kind in ('community_comment','community_reply','community_support')),
  'help',count(*) filter(where kind in ('help','beacon','help_response','supply','supply_match')))
 from public.notifications where user_id=auth.uid() and read_at is null;
$$;
revoke all on function public.my_unread_notification_counts() from public,anon;
grant execute on function public.my_unread_notification_counts() to authenticated;

-- Count confirmed accounts without exposing profiles or auth user records.
create schema if not exists private;
create or replace function private.total_member_count()
returns bigint language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 return (select count(*) from public.profiles p join auth.users u on u.id=p.id where u.email_confirmed_at is not null);
end;$$;
revoke all on function private.total_member_count() from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.total_member_count() to authenticated;
create or replace function public.total_member_count()
returns bigint language sql stable security invoker set search_path='' as $$
 select private.total_member_count();
$$;
revoke all on function public.total_member_count() from public,anon;
grant execute on function public.total_member_count() to authenticated;

-- Radius zero explicitly means the whole community for non-Beacon questions.
alter table public.help_requests add constraint help_question_audience_check
 check ((is_beacon and radius_miles in (5,15,25)) or (not is_beacon and radius_miles in (0,5,15,25,50,100))) not valid;
create or replace function public.notify_help_request()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id,kind,title,body,route,entity_id)
 select p.id,case when new.is_beacon then 'beacon' else 'help' end,
 case when new.is_beacon then 'T1 Beacon nearby' when new.radius_miles=0 then 'New community question' else 'New help request nearby' end,
 case when new.is_beacon then 'A T1DReach member near you needs time-sensitive help: '||new.item else 'A T1DReach member asked for help: '||new.item end,
 '/help-detail',new.id
 from public.profiles p
 left join public.approximate_locations helper_loc on helper_loc.user_id=p.id
 left join public.approximate_locations requester_loc on requester_loc.user_id=new.requester_id
 where p.id<>new.requester_id and p.helper_enabled=true
 and not public.users_blocked(p.id,new.requester_id)
 and ((not new.is_beacon and new.radius_miles=0) or public.distance_miles(helper_loc.latitude_bucket,helper_loc.longitude_bucket,requester_loc.latitude_bucket,requester_loc.longitude_bucket)<=new.radius_miles)
 and ((new.is_beacon and p.notify_beacon) or (not new.is_beacon and p.notify_nearby_help));
 return new;
end;$$;
revoke all on function public.notify_help_request() from public,anon,authenticated;
