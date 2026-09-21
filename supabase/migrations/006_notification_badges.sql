-- Notification helper RPCs
create or replace function public.my_unread_notification_count()
returns bigint language sql stable security definer set search_path=public as $$
 select count(*) from notifications where user_id=auth.uid() and read_at is null;
$$;
revoke all on function public.my_unread_notification_count() from public;
grant execute on function public.my_unread_notification_count() to authenticated;

create or replace function public.mark_notification_read(nid uuid)
returns void language sql security definer set search_path=public as $$
 update notifications set read_at=coalesce(read_at,now()) where id=nid and user_id=auth.uid();
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns void language sql security definer set search_path=public as $$
 update notifications set read_at=coalesce(read_at,now()) where user_id=auth.uid() and read_at is null;
$$;
revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;
