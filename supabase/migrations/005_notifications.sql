-- T1Together in-app notifications and help/response events
create table if not exists public.notifications(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null,
 title text not null,
 body text not null,
 route text,
 entity_id uuid,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

alter table public.help_requests add column if not exists is_beacon boolean not null default false;

create or replace function public.notify_help_request()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,kind,title,body,route,entity_id)
 select p.id,
  case when new.is_beacon then 'beacon' else 'help' end,
  case when new.is_beacon then 'T1 Beacon nearby' else 'New help request' end,
  case when new.is_beacon then 'A T1Together member in your community needs time-sensitive help: '||new.item else 'A T1Together member in your community asked for help: '||new.item end,
  '/(tabs)/help',new.id
 from profiles p
 join profiles requester on requester.id=new.requester_id
 where p.id<>new.requester_id and p.helper_enabled=true
 and not public.users_blocked(p.id,new.requester_id)
 and lower(coalesce(p.region,''))=lower(coalesce(requester.region,''))
 and (new.is_beacon and p.notify_beacon or not new.is_beacon and p.notify_nearby_help);
 return new;
end;$$;
drop trigger if exists on_help_request_notify on public.help_requests;
create trigger on_help_request_notify after insert on public.help_requests for each row execute function public.notify_help_request();

create or replace function public.notify_help_response()
returns trigger language plpgsql security definer set search_path=public as $$
declare owner_id uuid; item_name text;
begin
 select requester_id,item into owner_id,item_name from help_requests where id=new.request_id;
 if owner_id is not null and not public.users_blocked(owner_id,new.responder_id)
 and exists(select 1 from profiles where id=owner_id and notify_help_responses=true) then
  insert into notifications(user_id,kind,title,body,route,entity_id)
  values(owner_id,'help_response','Someone can help','A community member responded to your request: '||item_name,'/help-responses',new.request_id);
 end if;
 return new;
end;$$;
drop trigger if exists on_help_response_notify on public.beacon_responses;
create trigger on_help_response_notify after insert on public.beacon_responses for each row execute function public.notify_help_response();

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications')
 then alter publication supabase_realtime add table public.notifications; end if;
end $$;
