-- T1DReach product-name update. Historical migrations remain immutable;
-- current database-generated notification copy is updated here.

create or replace function public.notify_help_request()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,kind,title,body,route,entity_id)
 select p.id,case when new.is_beacon then 'beacon' else 'help' end,
 case when new.is_beacon then 'T1 Beacon nearby' else 'New help request nearby' end,
 case when new.is_beacon then 'A T1DReach member near you needs time-sensitive help: '||new.item else 'A T1DReach member near you asked for help: '||new.item end,
 '/help-detail',new.id
 from profiles p
 join approximate_locations helper_loc on helper_loc.user_id=p.id
 join approximate_locations requester_loc on requester_loc.user_id=new.requester_id
 where p.id<>new.requester_id and p.helper_enabled=true
 and not public.users_blocked(p.id,new.requester_id)
 and public.distance_miles(helper_loc.latitude_bucket,helper_loc.longitude_bucket,requester_loc.latitude_bucket,requester_loc.longitude_bucket)<=coalesce(new.radius_miles,15)
 and ((new.is_beacon and p.notify_beacon) or (not new.is_beacon and p.notify_nearby_help));
 return new;
end;$$;
