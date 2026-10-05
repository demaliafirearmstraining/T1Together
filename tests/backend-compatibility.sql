begin;
do $$ begin perform set_config('request.jwt.claim.sub',(select user_id::text from public.approximate_locations limit 1),true); end $$;
set local role authenticated;
do $$
begin
 if not exists(select updated_at from public.approximate_locations where user_id=auth.uid())
 then raise exception 'Freshness read failed'; end if;
 if exists(select user_id from public.approximate_locations where user_id<>auth.uid())
 then raise exception 'Location ownership filter failed'; end if;
 begin perform latitude_bucket from public.approximate_locations; raise exception 'Coordinates exposed';
 exception when insufficient_privilege then null; end;
 begin update public.conversation_members set conversation_id=conversation_id where false;
 raise exception 'Membership key editable'; exception when insufficient_privilege then null; end;
 begin update public.notifications set user_id=user_id where false;
 raise exception 'Notification ownership editable'; exception when insufficient_privilege then null; end;
 perform public.mark_conversation_read(null);
 perform public.mark_notification_read(null);
 perform public.my_unread_notification_count();
 perform public.community_post_stats();
 perform public.my_nearby_members(25);
 perform public.nearby_supply_posts(25);
 perform name from storage.objects where bucket_id='community-posts' limit 1;
end $$;
reset role;
select 'passed' as compatibility_checks,
 (select count(*) from pg_indexes where schemaname='public' and indexname in (
 'messages_conversation_created_id_idx','messages_sender_idx','conversation_members_user_conversation_idx',
 'posts_created_id_idx','posts_author_created_id_idx','post_comments_post_created_id_idx','post_comments_author_idx',
 'notifications_unread_user_kind_idx','help_requests_requester_created_idx','supply_posts_owner_created_idx',
 'supply_posts_open_category_expiry_idx','blocks_blocked_blocker_idx','beacon_responses_responder_request_idx',
 'post_bookmarks_post_idx','post_reactions_user_idx','push_outbox_user_idx','reports_reporter_idx',
 'posts_image_path_idx','post_comments_image_path_idx')) as indexes_present,
 (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'execute')) as anonymous_definer_access;
rollback;
