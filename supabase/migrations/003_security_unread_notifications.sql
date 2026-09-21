-- T1Together security, unread state, notification preferences, and block management
alter table public.conversation_members add column if not exists last_read_at timestamptz not null default now();

alter table public.profiles add column if not exists notify_messages boolean not null default true;
alter table public.profiles add column if not exists notify_nearby_help boolean not null default true;
alter table public.profiles add column if not exists notify_beacon boolean not null default true;
alter table public.profiles add column if not exists notify_help_responses boolean not null default true;

drop policy if exists "location community read" on public.approximate_locations;

create or replace function public.users_blocked(a uuid,b uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a));
$$;
revoke all on function public.users_blocked(uuid,uuid) from public;
grant execute on function public.users_blocked(uuid,uuid) to authenticated;

drop policy if exists "profiles read block aware" on public.profiles;
create policy "profiles read block aware" on public.profiles for select to authenticated
using(id=auth.uid() or not public.users_blocked(auth.uid(),id));
drop policy if exists "posts read block aware" on public.posts;
create policy "posts read block aware" on public.posts for select to authenticated
using(author_id=auth.uid() or not public.users_blocked(auth.uid(),author_id));
drop policy if exists "help read block aware" on public.help_requests;
create policy "help read block aware" on public.help_requests for select to authenticated
using(requester_id=auth.uid() or not public.users_blocked(auth.uid(),requester_id));
drop policy if exists "comments read block aware" on public.post_comments;
create policy "comments read block aware" on public.post_comments for select to authenticated
using(author_id=auth.uid() or not public.users_blocked(auth.uid(),author_id));

create or replace function public.my_blocked_members()
returns table(id uuid,display_name text)
language sql stable security definer set search_path=public as $$
 select p.id,p.display_name from blocks b join profiles p on p.id=b.blocked_id
 where b.blocker_id=auth.uid() order by p.display_name;
$$;
revoke all on function public.my_blocked_members() from public;
grant execute on function public.my_blocked_members() to authenticated;

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from conversation_members where conversation_id=cid and user_id=auth.uid());
$$;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.can_message(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from conversation_members me
 where me.conversation_id=cid and me.user_id=auth.uid())
 and not exists(
  select 1 from conversation_members other
  where other.conversation_id=cid and other.user_id<>auth.uid()
  and public.users_blocked(auth.uid(),other.user_id)
 );
$$;
revoke all on function public.can_message(uuid) from public;
grant execute on function public.can_message(uuid) to authenticated;

drop policy if exists "conversations create" on public.conversations;
drop policy if exists "conversation members insert" on public.conversation_members;
drop policy if exists "conversations member read" on public.conversations;
create policy "conversations member read" on public.conversations for select to authenticated using(public.is_conversation_member(id));
drop policy if exists "conversation members conversation read" on public.conversation_members;
create policy "conversation members conversation read" on public.conversation_members for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists "conversation members own update" on public.conversation_members;
create policy "conversation members own update" on public.conversation_members for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "messages member read" on public.messages;
create policy "messages member read" on public.messages for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists "messages member insert" on public.messages;
create policy "messages member insert" on public.messages for insert to authenticated
with check(sender_id=auth.uid() and public.can_message(conversation_id));

drop function if exists public.is_conversation_member(uuid,uuid);

drop policy if exists "response update own" on public.beacon_responses;
create policy "response update own" on public.beacon_responses for update to authenticated using(responder_id=auth.uid()) with check(responder_id=auth.uid());

create or replace function public.mark_conversation_read(cid uuid)
returns void language sql security definer set search_path=public as $$
 update conversation_members set last_read_at=now() where conversation_id=cid and user_id=auth.uid();
$$;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.my_unread_conversations()
returns table(conversation_id uuid,unread_count bigint)
language sql stable security definer set search_path=public as $$
 select cm.conversation_id,count(m.id)
 from conversation_members cm
 join messages m on m.conversation_id=cm.conversation_id and m.sender_id<>auth.uid() and m.created_at>cm.last_read_at
 where cm.user_id=auth.uid()
 group by cm.conversation_id;
$$;
revoke all on function public.my_unread_conversations() from public;
grant execute on function public.my_unread_conversations() to authenticated;

-- Fresh environments should receive message INSERT events. Existing environments may already contain it.
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages')
 then alter publication supabase_realtime add table public.messages; end if;
end $$;
