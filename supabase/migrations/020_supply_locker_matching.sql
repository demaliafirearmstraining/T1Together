-- Supply Locker discovery, expiration and match alerts
alter table public.supply_posts add column if not exists expires_at timestamptz;
update public.supply_posts set expires_at=created_at+interval '14 days' where expires_at is null;
alter table public.supply_posts alter column expires_at set default (now()+interval '14 days');

drop function if exists public.nearby_supply_posts(integer);\n\ncreate function public.nearby_supply_posts(max_miles integer default 25)
returns table(id uuid,owner_id uuid,post_type text,category text,item_name text,device_family text,quantity integer,details text,radius_miles integer,created_at timestamptz,expires_at timestamptz,display_name text,city text,region text,avatar_url text,distance_band text)
language sql security definer set search_path=public as $$
with mine as(select latitude_bucket lat,longitude_bucket lng from approximate_locations where user_id=auth.uid() limit 1),
candidates as(
 select sp.*,p.display_name,p.city,p.region,p.avatar_url,distance_miles(m.lat,m.lng,l.latitude_bucket,l.longitude_bucket) miles
 from mine m join approximate_locations l on l.user_id<>auth.uid()
 join supply_posts sp on sp.owner_id=l.user_id join profiles p on p.id=sp.owner_id
 where sp.status='open' and sp.expires_at>now() and p.is_public=true and not users_blocked(auth.uid(),sp.owner_id))
select c.id,c.owner_id,c.post_type,c.category,c.item_name,c.device_family,c.quantity,c.details,c.radius_miles,c.created_at,c.expires_at,c.display_name,c.city,c.region,c.avatar_url,
 case when c.miles<5 then 'Within 5 miles' when c.miles<15 then 'Within 15 miles' else 'Within 25 miles' end
from candidates c where c.miles<=least(greatest(max_miles,1),25) and c.miles<=c.radius_miles order by c.created_at desc;
$$;

create or replace function public.renew_supply_post(post_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin update supply_posts set status='open',expires_at=now()+interval '14 days' where id=post_id and owner_id=auth.uid();end;$$;
grant execute on function public.renew_supply_post(uuid) to authenticated;

create or replace function public.notify_supply_match()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,kind,title,body,route,entity_id)
 select distinct sp.owner_id,'supply_match','Supply Locker match nearby',
 case when new.post_type='offer' then 'Someone nearby offered a supply that may match your request: '||new.item_name else 'Someone nearby needs a supply that may match your offer: '||new.item_name end,
 '/supply-locker',new.id
 from supply_posts sp
 join approximate_locations a on a.user_id=sp.owner_id
 join approximate_locations b on b.user_id=new.owner_id
 where sp.owner_id<>new.owner_id and sp.status='open' and sp.expires_at>now()
 and sp.post_type<>new.post_type and sp.category=new.category
 and (sp.device_family is null or new.device_family is null or sp.device_family=new.device_family)
 and not users_blocked(sp.owner_id,new.owner_id)
 and distance_miles(a.latitude_bucket,a.longitude_bucket,b.latitude_bucket,b.longitude_bucket)<=least(sp.radius_miles,new.radius_miles);
 return new;
end;$$;
drop trigger if exists on_supply_post_match on public.supply_posts;
create trigger on_supply_post_match after insert on public.supply_posts for each row execute function public.notify_supply_match();
