-- T1Together feature expansion
create table if not exists public.post_comments(
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 1000),
 created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy "comments read" on public.post_comments for select to authenticated using(true);
create policy "comments insert own" on public.post_comments for insert to authenticated with check(auth.uid()=author_id);
create policy "comments delete own" on public.post_comments for delete to authenticated using(auth.uid()=author_id);

create table if not exists public.post_reactions(
 post_id uuid references public.posts(id) on delete cascade,
 user_id uuid references public.profiles(id) on delete cascade,
 reaction text not null default 'support',
 created_at timestamptz not null default now(),
 primary key(post_id,user_id)
);
alter table public.post_reactions enable row level security;
create policy "reactions read" on public.post_reactions for select to authenticated using(true);
create policy "reactions own" on public.post_reactions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

create policy "help update own" on public.help_requests for update to authenticated using(auth.uid()=requester_id) with check(auth.uid()=requester_id);
create policy "responses read" on public.beacon_responses for select to authenticated using(true);

-- Members can discover approximate community areas, never exact coordinates.
create policy "location community read" on public.approximate_locations for select to authenticated using(true);

-- Safe conversation creation/member management.
create policy "conversations create" on public.conversations for insert to authenticated with check(true);
create policy "conversation members insert" on public.conversation_members for insert to authenticated with check(user_id=auth.uid() or exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_members.conversation_id and cm.user_id=auth.uid()));

create or replace function public.start_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare cid uuid;
begin
 if other_user=auth.uid() then raise exception 'Cannot message yourself'; end if;
 select cm1.conversation_id into cid
 from conversation_members cm1 join conversation_members cm2 on cm1.conversation_id=cm2.conversation_id
 where cm1.user_id=auth.uid() and cm2.user_id=other_user limit 1;
 if cid is null then
  insert into conversations default values returning id into cid;
  insert into conversation_members(conversation_id,user_id) values(cid,auth.uid()),(cid,other_user);
 end if;
 return cid;
end;$$;
grant execute on function public.start_conversation(uuid) to authenticated;

-- Conversation members can see all members in conversations they belong to.
drop policy if exists "conversation members own read" on public.conversation_members;
create policy "conversation members conversation read" on public.conversation_members for select to authenticated
using(exists(select 1 from public.conversation_members mine where mine.conversation_id=conversation_members.conversation_id and mine.user_id=auth.uid()));

-- Reports can be reviewed by backend/admin tooling; reporters may see their own submissions.
create policy "reports own read" on public.reports for select to authenticated using(reporter_id=auth.uid());

-- Block-aware read helpers. These replace broad community reads so blocked relationships are respected.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read block aware" on public.profiles for select to authenticated using(
 id=auth.uid() or not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=profiles.id) or (b.blocker_id=profiles.id and b.blocked_id=auth.uid()))
);
drop policy if exists "posts read" on public.posts;
create policy "posts read block aware" on public.posts for select to authenticated using(
 author_id=auth.uid() or not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=posts.author_id) or (b.blocker_id=posts.author_id and b.blocked_id=auth.uid()))
);
drop policy if exists "help read" on public.help_requests;
create policy "help read block aware" on public.help_requests for select to authenticated using(
 requester_id=auth.uid() or not exists(select 1 from public.blocks b where (b.blocker_id=auth.uid() and b.blocked_id=help_requests.requester_id) or (b.blocker_id=help_requests.requester_id and b.blocked_id=auth.uid()))
);

-- Prevent blocked users from starting new conversations with each other.
create or replace function public.start_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare cid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if other_user=auth.uid() then raise exception 'Cannot message yourself'; end if;
 if not exists(select 1 from profiles where id=other_user) then raise exception 'Member not found'; end if;
 if exists(select 1 from blocks where (blocker_id=auth.uid() and blocked_id=other_user) or (blocker_id=other_user and blocked_id=auth.uid())) then
  raise exception 'Messaging unavailable';
 end if;
 select cm1.conversation_id into cid
 from conversation_members cm1 join conversation_members cm2 on cm1.conversation_id=cm2.conversation_id
 where cm1.user_id=auth.uid() and cm2.user_id=other_user limit 1;
 if cid is null then
  insert into conversations default values returning id into cid;
  insert into conversation_members(conversation_id,user_id) values(cid,auth.uid()),(cid,other_user);
 end if;
 return cid;
end;$$;

-- Only the request owner and responder can read Beacon responses.
drop policy if exists "responses read" on public.beacon_responses;
create policy "responses participant read" on public.beacon_responses for select to authenticated using(
 responder_id=auth.uid() or exists(select 1 from public.help_requests h where h.id=beacon_responses.request_id and h.requester_id=auth.uid())
);
