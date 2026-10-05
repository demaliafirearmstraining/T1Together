-- Run after migration. All identities, posts and notifications roll back.
begin;
create temporary table answers_test_ids(a uuid,b uuid,p uuid,other_post uuid,c uuid,other_comment uuid,g uuid);
insert into answers_test_ids select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),id from public.community_groups order by sort_order limit 1;
insert into auth.users(id,email,raw_user_meta_data) select u,'answer-group-test-'||u||'@example.invalid','{"display_name":"Answers test","role":"caregiver"}'::jsonb from answers_test_ids cross join lateral unnest(array[a,b]) u;
grant select on answers_test_ids to authenticated;
select set_config('request.jwt.claim.sub',(select a::text from answers_test_ids),true);
set local role authenticated;
do $$ begin
 begin
  insert into public.posts(author_id,body,group_id) select a,'Should require joining',g from answers_test_ids;
  raise exception 'Nonmember posted in group';
 exception when raise_exception then if sqlerrm<>'Join this group before posting in it' then raise;end if;end;
end $$;
insert into public.community_group_memberships(user_id,group_id) select a,g from answers_test_ids;
insert into public.posts(id,author_id,body,is_question,group_id) select p,a,'Question in joined group',true,g from answers_test_ids;
insert into public.posts(id,author_id,body) select other_post,a,'Other post' from answers_test_ids;
reset role;
select set_config('request.jwt.claim.sub',(select b::text from answers_test_ids),true);
set local role authenticated;
insert into public.post_comments(id,post_id,author_id,body) select c,p,b,'Helpful reply' from answers_test_ids;
insert into public.post_comments(id,post_id,author_id,body) select other_comment,other_post,b,'Different post reply' from answers_test_ids;
do $$ declare n integer;begin
 if exists(select 1 from public.community_group_memberships where user_id=(select a from answers_test_ids)) then raise exception 'Other memberships exposed';end if;
 if not exists(select 1 from public.posts where id=(select p from answers_test_ids)) then raise exception 'Open group post unreadable by nonmember';end if;
 update public.posts set helpful_comment_id=(select c from answers_test_ids),question_answered=true where id=(select p from answers_test_ids);
 get diagnostics n=row_count;if n<>0 then raise exception 'Nonowner marked an answer';end if;
 begin
  insert into public.community_group_memberships(user_id,group_id) select a,g from answers_test_ids;
  raise exception 'Other member join spoof allowed';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select a::text from answers_test_ids),true);
set local role authenticated;
do $$ begin
 begin
  update public.posts set helpful_comment_id=(select other_comment from answers_test_ids) where id=(select p from answers_test_ids);
  raise exception 'Cross-post answer permitted';
 exception when raise_exception then if sqlerrm<>'Helpful answer must be a visible comment on this post' then raise;end if;end;
end $$;
update public.posts set helpful_comment_id=(select c from answers_test_ids) where id=(select p from answers_test_ids);
do $$ begin if not exists(select 1 from public.posts where id=(select p from answers_test_ids) and question_answered and is_question and helpful_comment_id=(select c from answers_test_ids)) then raise exception 'Helpful answer state failed';end if;end $$;
update public.posts set helpful_comment_id=null,question_answered=false where id=(select p from answers_test_ids);
do $$ begin if exists(select 1 from public.posts where id=(select p from answers_test_ids) and (question_answered or helpful_comment_id is not null)) then raise exception 'Question reopen failed';end if;end $$;
update public.posts set helpful_comment_id=(select c from answers_test_ids) where id=(select p from answers_test_ids);
delete from public.community_group_memberships where user_id=(select a from answers_test_ids) and group_id=(select g from answers_test_ids);
update public.posts set body='Editing my existing post after leaving' where id=(select p from answers_test_ids);
reset role;
select set_config('request.jwt.claim.sub',(select b::text from answers_test_ids),true);
set local role authenticated;
delete from public.post_comments where id=(select c from answers_test_ids);
reset role;
do $$ begin
 if exists(select 1 from public.posts where id=(select p from answers_test_ids) and helpful_comment_id is not null) then raise exception 'Deleted helpful answer reference remains';end if;
 if has_table_privilege('anon','public.community_groups','SELECT') or has_table_privilege('authenticated','public.community_groups','INSERT') then raise exception 'Group directory grants incorrect';end if;
end $$;
select 'group membership, open visibility, answer selection, reopening and ownership checks passed' as result;
rollback;
