-- Privacy-preserving proximity and push outbox
create extension if not exists pgcrypto;

alter table public.approximate_locations add column if not exists latitude_bucket double precision;
alter table public.approximate_locations add column if not exists longitude_bucket double precision;
alter table public.approximate_locations add column if not exists updated_at timestamptz not null default now();
alter table public.approximate_locations enable row level security;
drop policy if exists "approx location own read" on public.approximate_locations;
create policy "approx location own read" on public.approximate_locations for select to authenticated using(user_id=auth.uid());
drop policy if exists "approx location own insert" on public.approximate_locations;
create policy "approx location own insert" on public.approximate_locations for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "approx location own update" on public.approximate_locations;
create policy "approx location own update" on public.approximate_locations for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create or replace function public.set_my_approximate_location(lat double precision,lng double precision)
returns void language plpgsql security definer set search_path=public as $$
declare blat double precision; blng double precision;
begin
 -- roughly 7-mile latitude buckets; raw device coordinates are never stored
 blat:=round(lat::numeric,1)::double precision;
 blng:=round(lng::numeric,1)::double precision;
 insert into approximate_locations(user_id,latitude_bucket,longitude_bucket,updated_at)
 values(auth.uid(),blat,blng,now())
 on conflict(user_id) do update set latitude_bucket=excluded.latitude_bucket,longitude_bucket=excluded.longitude_bucket,updated_at=now();
end;$$;
revoke all on function public.set_my_approximate_location(double precision,double precision) from public;
grant execute on function public.set_my_approximate_location(double precision,double precision) to authenticated;

create or replace function public.distance_miles(lat1 double precision,lon1 double precision,lat2 double precision,lon2 double precision)
returns double precision language sql immutable as $$
 select 3958.7613*2*asin(sqrt(power(sin(radians(lat2-lat1)/2),2)+cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lon2-lon1)/2),2)));
$$;

create or replace function public.my_nearby_members(max_miles double precision default 25)
returns table(member_id uuid,distance_band text)
language sql stable security definer set search_path=public as $$
 with me as(select latitude_bucket lat,longitude_bucket lng from approximate_locations where user_id=auth.uid()),
 d as(select a.user_id,public.distance_miles(me.lat,me.lng,a.latitude_bucket,a.longitude_bucket) miles from approximate_locations a cross join me where a.user_id<>auth.uid())
 select d.user_id,case when miles<5 then 'Within about 5 miles' when miles<15 then 'Within about 15 miles' else 'Within about 25 miles' end
 from d join profiles p on p.id=d.user_id
 where miles<=max_miles and not public.users_blocked(auth.uid(),d.user_id)
 order by miles;
$$;
revoke all on function public.my_nearby_members(double precision) from public;
grant execute on function public.my_nearby_members(double precision) to authenticated;

create table if not exists public.push_outbox(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null,title text not null,body text not null,
 entity_id uuid,conversation_id uuid,
 created_at timestamptz not null default now(),sent_at timestamptz
);
alter table public.push_outbox enable row level security;

create or replace function public.queue_notification_push()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into push_outbox(user_id,kind,title,body,entity_id)
 values(new.user_id,new.kind,new.title,new.body,new.entity_id);
 return new;
end;$$;
drop trigger if exists on_notification_queue_push on public.notifications;
create trigger on_notification_queue_push after insert on public.notifications for each row execute function public.queue_notification_push();

create or replace function public.notify_help_request()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,kind,title,body,route,entity_id)
 select p.id,case when new.is_beacon then 'beacon' else 'help' end,
 case when new.is_beacon then 'T1 Beacon nearby' else 'New help request nearby' end,
 case when new.is_beacon then 'A T1Together member near you needs time-sensitive help: '||new.item else 'A T1Together member near you asked for help: '||new.item end,
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

create or replace function public.notify_message_push()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into push_outbox(user_id,kind,title,body,conversation_id)
 select cm.user_id,'message','New message',left(new.body,120),new.conversation_id
 from conversation_members cm join profiles p on p.id=cm.user_id
 where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id
 and p.notify_messages=true and not public.users_blocked(cm.user_id,new.sender_id);
 return new;
end;$$;
drop trigger if exists on_message_queue_push on public.messages;
create trigger on_message_queue_push after insert on public.messages for each row execute function public.notify_message_push();
