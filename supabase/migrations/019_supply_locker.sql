-- Dedicated Supply Locker
create table if not exists public.supply_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null check (post_type in ('need','offer')),
  category text not null,
  item_name text not null,
  device_family text,
  quantity integer check (quantity is null or quantity > 0),
  details text,
  radius_miles integer not null default 15 check (radius_miles in (5,15,25)),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
alter table public.supply_posts enable row level security;
drop policy if exists "supply posts read" on public.supply_posts;
create policy "supply posts read" on public.supply_posts for select to authenticated using (
  owner_id=auth.uid() or exists(select 1 from public.profiles p where p.id=owner_id and p.is_public=true)
);
drop policy if exists "supply posts insert own" on public.supply_posts;
create policy "supply posts insert own" on public.supply_posts for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists "supply posts update own" on public.supply_posts;
create policy "supply posts update own" on public.supply_posts for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists "supply posts delete own" on public.supply_posts;
create policy "supply posts delete own" on public.supply_posts for delete to authenticated using(owner_id=auth.uid());

create or replace function public.nearby_supply_posts(max_miles integer default 25)
returns table(
 id uuid, owner_id uuid, post_type text, category text, item_name text, device_family text,
 quantity integer, details text, radius_miles integer, created_at timestamptz,
 display_name text, city text, region text, avatar_url text, distance_band text
)
language sql security definer set search_path=public
as $$
with mine as (
 select latitude_bucket lat,longitude_bucket lng from public.approximate_locations where user_id=auth.uid() limit 1
), candidates as (
 select sp.*,p.display_name,p.city,p.region,p.avatar_url,
 public.distance_miles(m.lat,m.lng,l.latitude_bucket,l.longitude_bucket) miles
 from mine m
 join public.approximate_locations l on l.user_id<>auth.uid()
 join public.supply_posts sp on sp.owner_id=l.user_id
 join public.profiles p on p.id=sp.owner_id
 where sp.status='open' and p.is_public=true
 and not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=sp.owner_id) or (b.blocker_id=sp.owner_id and b.blocked_id=auth.uid()))
)
select c.id,c.owner_id,c.post_type,c.category,c.item_name,c.device_family,c.quantity,c.details,c.radius_miles,c.created_at,
 c.display_name,c.city,c.region,c.avatar_url,
 case when c.miles<5 then 'Within 5 miles' when c.miles<15 then 'Within 15 miles' else 'Within 25 miles' end
from candidates c
where c.miles<=least(greatest(max_miles,1),25) and c.miles<=c.radius_miles
order by c.created_at desc;
$$;
grant execute on function public.nearby_supply_posts(integer) to authenticated;
