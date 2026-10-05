-- Community conversations, subscriptions, privacy and private alert preferences.
alter table public.post_comments add column if not exists image_path text;
alter table public.post_comments add column if not exists edited_at timestamptz;
alter table public.notifications add column if not exists comment_id uuid references public.post_comments(id) on delete set null;
alter table public.push_outbox add column if not exists comment_id uuid;
alter table public.profiles add column if not exists nearby_enabled boolean not null default true;

create table public.post_follows (
 user_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 muted boolean not null default false,
 primary key(user_id,post_id)
);
alter table public.post_follows enable row level security;
revoke all on public.post_follows from anon,authenticated;
grant select,insert,update,delete on public.post_follows to authenticated;
create policy "follow own read" on public.post_follows for select to authenticated using(user_id=(select auth.uid()));
create policy "follow own insert" on public.post_follows for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.posts where id=post_id));
create policy "follow own update" on public.post_follows for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.posts where id=post_id));
create policy "follow own delete" on public.post_follows for delete to authenticated using(user_id=(select auth.uid()));

create table public.comment_reactions (
 comment_id uuid not null references public.post_comments(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 primary key(comment_id,user_id)
);
alter table public.comment_reactions enable row level security;
revoke all on public.comment_reactions from anon,authenticated;
grant select,insert,delete on public.comment_reactions to authenticated;
create policy "visible comment support" on public.comment_reactions for select to authenticated using(exists(select 1 from public.post_comments c join public.posts p on p.id=c.post_id where c.id=comment_id));
create policy "own comment support" on public.comment_reactions for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.post_comments c join public.posts p on p.id=c.post_id where c.id=comment_id));
create policy "remove own support" on public.comment_reactions for delete to authenticated using(user_id=(select auth.uid()));

create table public.member_alert_preferences (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 notify_replies boolean not null default true,
 notify_followed_posts boolean not null default true,
 notify_supplies boolean not null default true,
 quiet_enabled boolean not null default false,
 quiet_start smallint not null default 1320 check(quiet_start between 0 and 1439),
 quiet_end smallint not null default 420 check(quiet_end between 0 and 1439),
 timezone text not null default 'UTC'
);
alter table public.member_alert_preferences enable row level security;
revoke all on public.member_alert_preferences from anon,authenticated;
grant select,insert,update,delete on public.member_alert_preferences to authenticated;
create policy "alert preferences own" on public.member_alert_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- Restrict edits to body/photo; keep authorship and thread placement immutable.
create policy "comments edit own" on public.post_comments for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create or replace function private.guard_comment_edit() returns trigger language plpgsql set search_path='' as $$
begin
 if new.post_id<>old.post_id or new.author_id<>old.author_id or new.parent_comment_id is distinct from old.parent_comment_id then raise exception 'Comment ownership and thread cannot change'; end if;
 new.edited_at=now(); return new;
end $$;
revoke all on function private.guard_comment_edit() from public,anon,authenticated;
create trigger guard_comment_edit before update on public.post_comments for each row execute function private.guard_comment_edit();

create or replace function public.queue_notification_push() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.push_outbox(user_id,kind,title,body,entity_id,comment_id) values(new.user_id,new.kind,new.title,new.body,new.entity_id,new.comment_id);
 return new;
end $$;
revoke all on function public.queue_notification_push() from public,anon,authenticated;

create or replace function public.notify_community_comment() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; parent_author_id uuid; recipient uuid; commenter_name text; preview text; k text;
begin
 select author_id into owner_id from public.posts where id=new.post_id;
 select author_id into parent_author_id from public.post_comments where id=new.parent_comment_id;
 select coalesce(nullif(trim(display_name),''),'Someone') into commenter_name from public.profiles where id=new.author_id;
 preview=left(regexp_replace(coalesce(new.body,''),'[[:space:]]+',' ','g'),120);
 for recipient in select owner_id union select parent_author_id union select user_id from public.post_follows where post_id=new.post_id and not muted loop
  if recipient is null or recipient=new.author_id or public.users_blocked(recipient,new.author_id) or public.users_blocked(recipient,owner_id) then continue; end if;
  if exists(select 1 from public.post_follows where post_id=new.post_id and user_id=recipient and muted) then continue; end if;
  k=case when recipient=parent_author_id then 'community_reply' when recipient=owner_id then 'community_comment' else 'community_follow' end;
  if k='community_comment' and not coalesce((select notify_community_comments from public.profiles where id=recipient),true) then continue; end if;
  if k='community_reply' and not coalesce((select notify_replies from public.member_alert_preferences where user_id=recipient),true) then continue; end if;
  if k='community_follow' and not coalesce((select notify_followed_posts from public.member_alert_preferences where user_id=recipient),true) then continue; end if;
  insert into public.notifications(user_id,kind,title,body,route,entity_id,comment_id) values(recipient,k,case k when 'community_reply' then 'New reply to your comment' when 'community_follow' then 'New activity on a followed post' else 'New comment on your post' end,commenter_name||' wrote: '||preview,'/post-detail',new.post_id,new.id);
 end loop;
 return new;
end $$;
revoke all on function public.notify_community_comment() from public,anon,authenticated;

create or replace function private.notify_comment_support() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.post_comments; supporter text;
begin
 select * into c from public.post_comments where id=new.comment_id;
 if c.author_id=new.user_id or public.users_blocked(c.author_id,new.user_id) or not coalesce((select notify_community_support from public.profiles where id=c.author_id),true) then return new; end if;
 select coalesce(display_name,'Someone') into supporter from public.profiles where id=new.user_id;
 insert into public.notifications(user_id,kind,title,body,route,entity_id,comment_id) values(c.author_id,'community_support','Someone supported your comment',supporter||' supported your comment.','/post-detail',c.post_id,c.id);
 return new;
end $$;
revoke all on function private.notify_comment_support() from public,anon,authenticated;
create trigger notify_comment_support after insert on public.comment_reactions for each row execute function private.notify_comment_support();

create or replace function public.my_unread_notification_counts() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('community',count(*) filter(where kind in ('community_comment','community_reply','community_support','community_follow')),'help',count(*) filter(where kind in ('help','beacon','help_response','supply','supply_match'))) from public.notifications where user_id=(select auth.uid()) and read_at is null;
$$;
revoke all on function public.my_unread_notification_counts() from public,anon;
grant execute on function public.my_unread_notification_counts() to authenticated;

-- Respect the independent Nearby discovery toggle in both discovery RPCs.
do $migration$
declare f record;
begin
 for f in select oid,pg_get_functiondef(oid) def from pg_proc where pronamespace='public'::regnamespace and proname in ('my_nearby_members','search_nearby_public_members') loop
  execute replace(f.def,'p.is_public=true','p.is_public=true and p.nearby_enabled=true');
 end loop;
end $migration$;

-- Realtime comment support.
alter publication supabase_realtime add table public.comment_reactions;

alter table public.profiles add column if not exists introduction_dismissed boolean not null default false;

create index post_follows_post_idx on public.post_follows(post_id);
create index comment_reactions_user_idx on public.comment_reactions(user_id);
create index notifications_comment_idx on public.notifications(comment_id);
create or replace function private.check_alert_timezone() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'Invalid time zone'; end if;
 if new.quiet_enabled and new.quiet_start=new.quiet_end then raise exception 'Quiet hours must have different start and end times'; end if;
 return new;
end $$;
revoke all on function private.check_alert_timezone() from public,anon,authenticated;
create trigger check_alert_timezone before insert or update on public.member_alert_preferences for each row execute function private.check_alert_timezone();

alter table public.post_comments add constraint comment_photo_owner check(image_path is null or split_part(image_path,'/',1)=author_id::text);
