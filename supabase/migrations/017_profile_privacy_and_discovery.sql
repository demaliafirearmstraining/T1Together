-- Profile discovery privacy and structured member search
alter table public.profiles add column if not exists is_public boolean not null default true;

create or replace function public.search_public_members(
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
  devices text[], insulins text[], experience_topics text[], help_topics text[]
)
language sql security definer set search_path=public
as $$
  select p.id,p.display_name,p.role::text,p.bio,p.city,p.region,p.avatar_url,p.helper_enabled,
         p.diagnosis_year,p.devices,p.insulins,p.experience_topics,p.help_topics
  from public.profiles p
  where p.is_public=true
    and p.id<>auth.uid()
    and not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and (coalesce(trim(search_text),'')='' or p.display_name ilike '%'||trim(search_text)||'%' or p.city ilike '%'||trim(search_text)||'%' or p.region ilike '%'||trim(search_text)||'%')
    and (coalesce(role_filter,'')='' or p.role::text=role_filter)
    and (coalesce(device_filter,'')='' or p.devices @> array[device_filter])
    and (coalesce(insulin_filter,'')='' or p.insulins @> array[insulin_filter])
    and (coalesce(experience_filter,'')='' or p.experience_topics @> array[experience_filter])
    and (coalesce(help_filter,'')='' or p.help_topics @> array[help_filter])
    and (not helpers_only or p.helper_enabled=true)
  order by p.display_name
  limit 100;
$$;
grant execute on function public.search_public_members(text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.is_profile_visible(profile_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select profile_id=auth.uid() or exists(select 1 from public.profiles p where p.id=profile_id and p.is_public=true);
$$;
grant execute on function public.is_profile_visible(uuid) to authenticated;
