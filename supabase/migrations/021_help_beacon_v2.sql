-- Help / T1 Beacon V2: lifecycle, participation views and proximity
alter table public.help_requests add column if not exists expires_at timestamptz;
update public.help_requests set expires_at=case when is_beacon then created_at+interval '6 hours' when urgency='now' then created_at+interval '12 hours' when urgency='today' then created_at+interval '1 day' else created_at+interval '7 days' end where expires_at is null;

create or replace function public.set_help_expiration()
returns trigger language plpgsql set search_path=public as $$
begin
 new.expires_at:=case when new.is_beacon then now()+interval '6 hours' when new.urgency='now' then now()+interval '12 hours' when new.urgency='today' then now()+interval '1 day' else now()+interval '7 days' end;
 return new;
end;$$;
drop trigger if exists set_help_expiration_before_insert on public.help_requests;
create trigger set_help_expiration_before_insert before insert on public.help_requests for each row execute function public.set_help_expiration();

create or replace function public.renew_help_request(req_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update help_requests set status='open',expires_at=case when is_beacon then now()+interval '6 hours' when urgency='now' then now()+interval '12 hours' when urgency='today' then now()+interval '1 day' else now()+interval '7 days' end
 where id=req_id and requester_id=auth.uid();
end;$$;
grant execute on function public.renew_help_request(uuid) to authenticated;

create or replace function public.my_help_activity()
returns table(request_id uuid,relationship text,response_created_at timestamptz)
language sql stable security definer set search_path=public as $$
 select h.id,'requester'::text,null::timestamptz from help_requests h where h.requester_id=auth.uid()
 union all
 select b.request_id,'helper'::text,b.created_at from beacon_responses b where b.responder_id=auth.uid()
$$;
grant execute on function public.my_help_activity() to authenticated;
