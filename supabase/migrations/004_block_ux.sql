-- T1Together block UX helpers
-- Keep blocked-member labels available to the blocker without weakening profile RLS.
drop function if exists public.my_blocked_members();
create function public.my_blocked_members()
returns table(member_id uuid, member_name text)
language sql stable security definer set search_path=public as $$
 select p.id,p.display_name
 from public.blocks b
 join public.profiles p on p.id=b.blocked_id
 where b.blocker_id=auth.uid()
 order by p.display_name;
$$;
revoke all on function public.my_blocked_members() from public;
grant execute on function public.my_blocked_members() to authenticated;

-- Friendly preflight for chat UI. RLS remains the final enforcement layer.
create or replace function public.can_message(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.conversation_members me where me.conversation_id=cid and me.user_id=auth.uid())
 and not exists(
  select 1 from public.conversation_members other
  where other.conversation_id=cid and other.user_id<>auth.uid()
  and public.users_blocked(auth.uid(),other.user_id)
 );
$$;
revoke all on function public.can_message(uuid) from public;
grant execute on function public.can_message(uuid) to authenticated;
