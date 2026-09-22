-- Production hardening pass 3: Community, Help, Supply, messaging and notifications

-- Community statistics must respect the caller's existing RLS visibility.
create or replace function public.community_post_stats()
returns table(post_id uuid,support_count bigint,comment_count bigint)
language sql stable security invoker set search_path=public as $$
 select p.id,
   (select count(*) from public.post_reactions r where r.post_id=p.id),
   (select count(*) from public.post_comments c where c.post_id=p.id)
 from public.posts p;
$$;
revoke all on function public.community_post_stats() from public;
grant execute on function public.community_post_stats() to authenticated;

-- Help responses: keep participation private and prevent responding to closed/expired,
-- blocked, or self-authored requests.
drop policy if exists "response insert own" on public.beacon_responses;
create policy "response insert eligible" on public.beacon_responses
for insert to authenticated with check(
 responder_id=auth.uid()
 and exists(
   select 1 from public.help_requests h
   where h.id=request_id
     and h.requester_id<>auth.uid()
     and h.status='open'
     and (h.expires_at is null or h.expires_at>now())
     and not public.users_blocked(auth.uid(),h.requester_id)
 )
);

-- Supply discovery must be block-aware even for direct table reads.
drop policy if exists "supply posts read" on public.supply_posts;
create policy "supply posts read safe" on public.supply_posts
for select to authenticated using(
 owner_id=auth.uid()
 or (
   exists(select 1 from public.profiles p where p.id=owner_id and p.is_public=true)
   and not public.users_blocked(auth.uid(),owner_id)
 )
);

-- Message insertion must pass both membership and block checks at the database boundary.
drop policy if exists "messages member insert" on public.messages;
create policy "messages member insert safe" on public.messages
for insert to authenticated with check(
 sender_id=auth.uid()
 and public.is_conversation_member(conversation_id,auth.uid())
 and public.can_message(conversation_id)
 and char_length(btrim(body)) between 1 and 1500
);

-- Notifications remain owner-only. Explicitly ensure clients cannot create/delete them.
drop policy if exists "notifications own insert" on public.notifications;
drop policy if exists "notifications own delete" on public.notifications;

-- Push outbox is internal-only: RLS enabled with no client policies.
alter table public.push_outbox enable row level security;

-- Internal trigger/helper functions are not API endpoints.
revoke all on function public.notify_help_request() from public;
revoke all on function public.notify_help_response() from public;
revoke all on function public.queue_notification_push() from public;
revoke all on function public.notify_message_push() from public;
revoke all on function public.clear_resolved_help_notifications() from public;
revoke all on function public.notify_supply_match() from public;
revoke all on function public.set_help_expiration() from public;

-- SECURITY DEFINER client RPCs: authenticated only.
revoke all on function public.renew_supply_post(uuid) from public;
grant execute on function public.renew_supply_post(uuid) to authenticated;
revoke all on function public.nearby_supply_posts(integer) from public;
grant execute on function public.nearby_supply_posts(integer) to authenticated;
revoke all on function public.renew_help_request(uuid) from public;
grant execute on function public.renew_help_request(uuid) to authenticated;
revoke all on function public.my_help_activity() from public;
grant execute on function public.my_help_activity() to authenticated;
