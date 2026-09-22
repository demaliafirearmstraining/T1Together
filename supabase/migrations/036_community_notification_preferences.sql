-- Community notification preferences and polished Community push notifications

alter table public.profiles
 add column if not exists notify_community_comments boolean not null default true,
 add column if not exists notify_community_support boolean not null default true;

create or replace function public.notify_community_comment()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
 owner_id uuid;
 commenter_name text;
 preview text;
begin
 select p.author_id into owner_id from public.posts p where p.id=new.post_id;
 if owner_id is null or owner_id=new.author_id or public.users_blocked(owner_id,new.author_id) then return new; end if;
 if not coalesce((select notify_community_comments from public.profiles where id=owner_id),true) then return new; end if;

 select coalesce(nullif(trim(display_name),''),'Someone') into commenter_name from public.profiles where id=new.author_id;
 preview:=left(regexp_replace(coalesce(new.body,''),'[[:space:]]+',' ','g'),120);

 insert into public.notifications(user_id,kind,title,body,route,entity_id)
 values(owner_id,'community_comment','New comment on your post',
        commenter_name||' commented: '||preview,
        '/post-detail',new.post_id);
 return new;
end;
$$;

drop trigger if exists on_community_comment_notify on public.post_comments;
create trigger on_community_comment_notify
after insert on public.post_comments
for each row execute function public.notify_community_comment();

create or replace function public.notify_community_support()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
 owner_id uuid;
 supporter_name text;
begin
 select p.author_id into owner_id from public.posts p where p.id=new.post_id;
 if owner_id is null or owner_id=new.user_id or public.users_blocked(owner_id,new.user_id) then return new; end if;
 if not coalesce((select notify_community_support from public.profiles where id=owner_id),true) then return new; end if;

 select coalesce(nullif(trim(display_name),''),'Someone') into supporter_name from public.profiles where id=new.user_id;

 insert into public.notifications(user_id,kind,title,body,route,entity_id)
 values(owner_id,'community_support','Someone supported your post',
        supporter_name||' supported your post.',
        '/post-detail',new.post_id);
 return new;
end;
$$;

drop trigger if exists on_community_support_notify on public.post_reactions;
create trigger on_community_support_notify
after insert on public.post_reactions
for each row execute function public.notify_community_support();

revoke all on function public.notify_community_comment() from public;
revoke all on function public.notify_community_support() from public;
