-- Preserve authenticated-only execution for the two discovery RPCs we updated.
revoke all on function public.my_nearby_members(double precision) from public,anon;
grant execute on function public.my_nearby_members(double precision) to authenticated;
revoke all on function public.search_nearby_public_members(integer,text,text,text,text,text,text,boolean) from public,anon;
grant execute on function public.search_nearby_public_members(integer,text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.notify_community_support()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
 owner_id uuid;
 supporter_name text;
begin
 select p.author_id into owner_id from public.posts p where p.id=new.post_id;
 if owner_id is null or owner_id=new.user_id or public.users_blocked(owner_id,new.user_id) then return new; end if;
 if exists(select 1 from public.post_follows where post_id=new.post_id and user_id=owner_id and muted) then return new; end if;
 if not coalesce((select notify_community_support from public.profiles where id=owner_id),true) then return new; end if;

 select coalesce(nullif(trim(display_name),''),'Someone') into supporter_name from public.profiles where id=new.user_id;

 insert into public.notifications(user_id,kind,title,body,route,entity_id)
 values(owner_id,'community_support','Someone supported your post',
        supporter_name||' supported your post.',
        '/post-detail',new.post_id);
 return new;
end;
$$;
revoke all on function public.notify_community_support() from public,anon,authenticated;

create or replace function private.notify_comment_support() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.post_comments; supporter text;
begin
 select * into c from public.post_comments where id=new.comment_id;
 if c.author_id=new.user_id or public.users_blocked(c.author_id,new.user_id) or not coalesce((select notify_community_support from public.profiles where id=c.author_id),true) then return new; end if;
 if exists(select 1 from public.post_follows where post_id=c.post_id and user_id=c.author_id and muted) then return new;end if;
 select coalesce(display_name,'Someone') into supporter from public.profiles where id=new.user_id;
 insert into public.notifications(user_id,kind,title,body,route,entity_id,comment_id) values(c.author_id,'community_support','Someone supported your comment',supporter||' supported your comment.','/post-detail',c.post_id,c.id);
 return new;
end $$;
revoke all on function private.notify_comment_support() from public,anon,authenticated;
