-- Optional open community groups. Memberships are private to each member.
create table public.community_groups (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text not null,
 sort_order integer not null default 0
);
alter table public.community_groups enable row level security;
revoke all on public.community_groups from anon,authenticated;
grant select on public.community_groups to authenticated;
create policy "signed in group directory" on public.community_groups for select to authenticated using((select auth.uid()) is not null);
create table public.community_group_memberships (
 user_id uuid not null references public.profiles(id) on delete cascade,
 group_id uuid not null references public.community_groups(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(user_id,group_id)
);
alter table public.community_group_memberships enable row level security;
revoke all on public.community_group_memberships from anon,authenticated;
grant select,insert,delete on public.community_group_memberships to authenticated;
create policy "group membership own read" on public.community_group_memberships for select to authenticated using(user_id=(select auth.uid()));
create policy "group membership own join" on public.community_group_memberships for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.community_groups g where g.id=group_id));
create policy "group membership own leave" on public.community_group_memberships for delete to authenticated using(user_id=(select auth.uid()));
create index community_group_memberships_group_idx on public.community_group_memberships(group_id);
insert into public.community_groups(slug,name,description,sort_order) values
 ('newly-diagnosed','Newly Diagnosed','A place for first questions, early experiences and finding your footing with T1D.',1),
 ('adult-t1d','Adults Living with T1D','Connect about work, relationships, routines and life as an adult with T1D.',2),
 ('parents-caregivers','Parents & Caregivers','Share the everyday experience of supporting someone with T1D.',3),
 ('multiple-t1d-children','Parents of Multiple Children with T1D','Connect with families managing T1D across more than one child.',4),
 ('school-support','School & College Support','Talk about school routines, activities, accommodations and transitions.',5),
 ('t1d-wellbeing','T1D & Everyday Wellbeing','Peer conversations about motivation, burnout and balancing life with T1D.',6);

alter table public.posts add column group_id uuid references public.community_groups(id) on delete set null;
create index posts_group_created_idx on public.posts(group_id,created_at desc);
alter table public.posts add column is_question boolean not null default false;
alter table public.posts add column question_answered boolean not null default false;
alter table public.posts add column helpful_comment_id uuid references public.post_comments(id) on delete set null;
create index posts_helpful_comment_idx on public.posts(helpful_comment_id);

create or replace function private.guard_post_community_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and new.author_id<>old.author_id then raise exception 'Post author cannot change';end if;
 if new.group_id is not null and (tg_op='INSERT' or new.group_id is distinct from old.group_id) then
  if not exists(select 1 from public.community_group_memberships where user_id=new.author_id and group_id=new.group_id) then raise exception 'Join this group before posting in it';end if;
 end if;
 if new.helpful_comment_id is not null and (tg_op='INSERT' or new.helpful_comment_id is distinct from old.helpful_comment_id) then
  if not exists(select 1 from public.post_comments where id=new.helpful_comment_id and post_id=new.id) then raise exception 'Helpful answer must be a visible comment on this post';end if;
  new.question_answered=true;new.is_question=true;
 end if;
 if new.question_answered then new.is_question=true;end if;
 if new.helpful_comment_id is not null and not new.question_answered then raise exception 'Clear the helpful answer before reopening the question';end if;
 return new;
end $$;
revoke all on function private.guard_post_community_fields() from public,anon,authenticated;
create trigger guard_post_community_fields before insert or update on public.posts for each row execute function private.guard_post_community_fields();

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='posts') then alter publication supabase_realtime add table public.posts;end if;
end $$;
