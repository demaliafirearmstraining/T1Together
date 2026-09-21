-- Fix help-response notification generation and expose response counts
create or replace function public.notify_help_response()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
 owner_id uuid;
 item_name text;
 wants_alert boolean;
begin
 select h.requester_id,h.item into owner_id,item_name
 from public.help_requests h where h.id=new.request_id;

 if owner_id is null or owner_id=new.responder_id then return new; end if;
 if public.users_blocked(owner_id,new.responder_id) then return new; end if;

 select coalesce(p.notify_help_responses,true) into wants_alert
 from public.profiles p where p.id=owner_id;

 if coalesce(wants_alert,true) then
  insert into public.notifications(user_id,kind,title,body,route,entity_id)
  values(owner_id,'help_response','Someone can help',
   'A community member responded to your request: '||coalesce(item_name,'Help request'),
   '/help-responses',new.request_id);
 end if;
 return new;
end;
$$;
drop trigger if exists on_help_response_notify on public.beacon_responses;
create trigger on_help_response_notify
after insert on public.beacon_responses
for each row execute function public.notify_help_response();

create or replace function public.help_response_counts()
returns table(request_id uuid,response_count bigint)
language sql stable security definer set search_path=public as $$
 select br.request_id,count(*)
 from public.beacon_responses br
 join public.help_requests h on h.id=br.request_id
 where h.requester_id=auth.uid()
 group by br.request_id;
$$;
revoke all on function public.help_response_counts() from public;
grant execute on function public.help_response_counts() to authenticated;
