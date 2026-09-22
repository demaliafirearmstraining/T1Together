-- Distance-aware profile discovery without exposing stored location buckets
create or replace function public.search_nearby_public_members(
  max_miles integer default 25,
  search_text text default null,
  role_filter text default null,
  device_filter text default null,
  insulin_filter text default null,
  experience_filter text default null,
  help_filter text default null,
  helpers_only boolean default false
)
returns table(
  id uuid, display_name text, role text, bio text, city text, region text,
  avatar_url text, helper_enabled boolean, diagnosis_year smallint,
  devices text[], insulins text[], experience_topics text[], help_topics text[],
  distance_band text
)
language sql security definer set search_path=public
as $$
with mine as (
  select latitude_bucket lat, longitude_bucket lng
  from public.approximate_locations
  where user_id=auth.uid()
  limit 1
), candidates as (
  select p.*, public.distance_miles(m.lat,m.lng,l.latitude_bucket,l.longitude_bucket) miles
  from mine m
  join public.approximate_locations l on l.user_id<>auth.uid()
  join public.profiles p on p.id=l.user_id
  where p.is_public=true
    and not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
)
select c.id,c.display_name,c.role::text,c.bio,c.city,c.region,c.avatar_url,c.helper_enabled,
       c.diagnosis_year,c.devices,c.insulins,c.experience_topics,c.help_topics,
       case when c.miles<5 then 'Within 5 miles' when c.miles<15 then 'Within 15 miles' else 'Within 25 miles' end
from candidates c
where c.miles<=greatest(1,least(max_miles,25))
  and (coalesce(trim(search_text),'')='' or c.display_name ilike '%'||trim(search_text)||'%' or c.city ilike '%'||trim(search_text)||'%' or c.region ilike '%'||trim(search_text)||'%')
  and (coalesce(role_filter,'')='' or c.role::text=role_filter)
  and (coalesce(device_filter,'')='' or c.devices @> array[device_filter])
  and (coalesce(insulin_filter,'')='' or c.insulins @> array[insulin_filter])
  and (coalesce(experience_filter,'')='' or c.experience_topics @> array[experience_filter])
  and (coalesce(help_filter,'')='' or c.help_topics @> array[help_filter])
  and (not helpers_only or c.helper_enabled=true)
order by c.miles,c.display_name
limit 100;
$$;
grant execute on function public.search_nearby_public_members(integer,text,text,text,text,text,text,boolean) to authenticated;
