-- Automatically clear notifications tied to resolved help requests
create or replace function public.clear_resolved_help_notifications()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='closed' and old.status is distinct from new.status then
  update notifications set read_at=coalesce(read_at,now()) where entity_id=new.id and read_at is null;
 end if;
 return new;
end;$$;
drop trigger if exists on_help_request_resolved_clear_notifications on public.help_requests;
create trigger on_help_request_resolved_clear_notifications after update of status on public.help_requests for each row execute function public.clear_resolved_help_notifications();
