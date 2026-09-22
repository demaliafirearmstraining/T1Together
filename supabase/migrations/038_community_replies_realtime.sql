-- Community replies and realtime reliability

alter table public.post_comments
 add column if not exists parent_comment_id uuid references public.post_comments(id) on delete cascade;

create index if not exists post_comments_parent_idx on public.post_comments(parent_comment_id);

-- Ensure Community comment/support changes are published to Supabase Realtime.
do $$ begin
 if not exists(
  select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='post_comments'
 ) then alter publication supabase_realtime add table public.post_comments; end if;
 if not exists(
  select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='post_reactions'
 ) then alter publication supabase_realtime add table public.post_reactions; end if;
end $$;

-- Keep comment creation tied to the signed-in author and require replies to belong
-- to the same post.
drop policy if exists "comments insert own" on public.post_comments;
create policy "comments insert own" on public.post_comments
for insert to authenticated
with check(
 author_id=auth.uid()
 and (
  parent_comment_id is null
  or exists(
   select 1 from public.post_comments parent
   where parent.id=parent_comment_id and parent.post_id=post_id
  )
 )
);

-- Notify both the post owner and, for replies, the parent-comment author.
create or replace function public.notify_community_comment()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
 owner_id uuid;
 parent_author_id uuid;
 commenter_name text;
 preview text;
begin
 select p.author_id into owner_id from public.posts p where p.id=new.post_id;
 select c.author_id into parent_author_id from public.post_comments c where c.id=new.parent_comment_id;
 select coalesce(nullif(trim(display_name),''),'Someone') into commenter_name
 from public.profiles where id=new.author_id;
 preview:=left(regexp_replace(coalesce(new.body,''),'[[:space:]]+',' ','g'),120);

 if owner_id is not null
    and owner_id<>new.author_id
    and not public.users_blocked(owner_id,new.author_id)
    and coalesce((select notify_community_comments from public.profiles where id=owner_id),true)
 then
  insert into public.notifications(user_id,kind,title,body,route,entity_id)
  values(
   owner_id,
   case when new.parent_comment_id is null then 'community_comment' else 'community_reply' end,
   case when new.parent_comment_id is null then 'New comment on your post' else 'New reply on your post' end,
   commenter_name||case when new.parent_comment_id is null then ' commented: ' else ' replied: ' end||preview,
   '/post-detail',new.post_id
  );
 end if;

 if parent_author_id is not null
    and parent_author_id<>new.author_id
    and parent_author_id is distinct from owner_id
    and not public.users_blocked(parent_author_id,new.author_id)
    and coalesce((select notify_community_comments from public.profiles where id=parent_author_id),true)
 then
  insert into public.notifications(user_id,kind,title,body,route,entity_id)
  values(parent_author_id,'community_reply','New reply to your comment',
         commenter_name||' replied: '||preview,
         '/post-detail',new.post_id);
 end if;

 return new;
end;
$$;

revoke all on function public.notify_community_comment() from public;
