-- Reliable current-user response state for Help / T1 Beacon details.
-- Keeps response lookup behind a small authenticated RPC so UI state does not
-- depend on direct table-select policy behavior.
create or replace function public.my_help_response(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
 select auth.uid() is not null and exists(
  select 1 from public.beacon_responses br
  where br.request_id=req_id and br.responder_id=auth.uid()
 );
$$;
revoke all on function public.my_help_response(uuid) from public;
grant execute on function public.my_help_response(uuid) to authenticated;
