-- Storage objects are deleted by the delete-account Edge Function through
-- the Storage API. Keep this RPC focused on relational application data.
create or replace function public.delete_my_app_data()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 delete from public.profiles where id=uid;
end;
$$;
revoke all on function public.delete_my_app_data() from public;
grant execute on function public.delete_my_app_data() to authenticated;
