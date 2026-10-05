-- Compatible with the submitted app. Apply this file alone, never the historical backlog.
-- Tables measured below 128 KiB at deployment; fail fast instead of waiting on writes.
set local lock_timeout = '2s';
set local statement_timeout = '15s';
create index if not exists messages_conversation_created_id_idx on public.messages(conversation_id,created_at desc,id desc);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists conversation_members_user_conversation_idx on public.conversation_members(user_id,conversation_id);
create index if not exists posts_created_id_idx on public.posts(created_at desc,id desc);
create index if not exists posts_author_created_id_idx on public.posts(author_id,created_at desc,id desc);
create index if not exists post_comments_post_created_id_idx on public.post_comments(post_id,created_at,id);
create index if not exists post_comments_author_idx on public.post_comments(author_id);
create index if not exists notifications_unread_user_kind_idx on public.notifications(user_id,kind) where read_at is null;
create index if not exists help_requests_requester_created_idx on public.help_requests(requester_id,created_at desc);
create index if not exists supply_posts_owner_created_idx on public.supply_posts(owner_id,created_at desc);
create index if not exists supply_posts_open_category_expiry_idx on public.supply_posts(category,expires_at) where status='open';
create index if not exists blocks_blocked_blocker_idx on public.blocks(blocked_id,blocker_id);
create index if not exists beacon_responses_responder_request_idx on public.beacon_responses(responder_id,request_id);
create index if not exists post_bookmarks_post_idx on public.post_bookmarks(post_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index if not exists push_outbox_user_idx on public.push_outbox(user_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

-- The current client reads only its own timestamp to avoid redundant GPS updates.
create policy "approx location own freshness read" on public.approximate_locations
for select to authenticated using (user_id = (select auth.uid()));
revoke select on public.approximate_locations from anon, authenticated;
grant select(user_id,updated_at) on public.approximate_locations to authenticated;

-- Preserve read receipts while preventing reassignment of membership or notification content.
revoke update on public.conversation_members from anon, authenticated;
grant update(last_read_at) on public.conversation_members to authenticated;
revoke update on public.notifications from anon, authenticated;
grant update(read_at) on public.notifications to authenticated;

alter function public.distance_miles(double precision,double precision,double precision,double precision)
set search_path = '';

-- Existing private photo links remain valid; new signatures follow content visibility.
alter policy "community photo authenticated read" on storage.objects using (
 bucket_id = 'community-posts' and (
  (storage.foldername(name))[1] = (select auth.uid())::text
  or exists (select 1 from public.posts p where p.image_path = objects.name)
  or exists (select 1 from public.post_comments c join public.posts p on p.id=c.post_id
             where c.image_path=objects.name)
 )
 );
create index if not exists posts_image_path_idx on public.posts(image_path) where image_path is not null;
create index if not exists post_comments_image_path_idx on public.post_comments(image_path) where image_path is not null;

-- Trigger functions remain executable by their owning backend role; signed-in RPCs retain access.
revoke execute on function public.can_message(cid uuid) from public, anon;
grant execute on function public.can_message(cid uuid) to authenticated;
revoke execute on function public.clear_resolved_help_notifications() from public, anon, authenticated;
revoke execute on function public.delete_my_app_data() from public, anon;
grant execute on function public.delete_my_app_data() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.help_response_counts() from public, anon;
grant execute on function public.help_response_counts() to authenticated;
revoke execute on function public.is_conversation_member(cid uuid) from public, anon;
grant execute on function public.is_conversation_member(cid uuid) to authenticated;
revoke execute on function public.is_profile_visible(profile_id uuid) from public, anon;
grant execute on function public.is_profile_visible(profile_id uuid) to authenticated;
revoke execute on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;
revoke execute on function public.mark_conversation_read(cid uuid) from public, anon;
grant execute on function public.mark_conversation_read(cid uuid) to authenticated;
revoke execute on function public.mark_notification_read(nid uuid) from public, anon;
grant execute on function public.mark_notification_read(nid uuid) to authenticated;
revoke execute on function public.my_blocked_members() from public, anon;
grant execute on function public.my_blocked_members() to authenticated;
revoke execute on function public.my_help_activity() from public, anon;
grant execute on function public.my_help_activity() to authenticated;
revoke execute on function public.my_help_response(req_id uuid) from public, anon;
grant execute on function public.my_help_response(req_id uuid) to authenticated;
revoke execute on function public.my_nearby_members(max_miles double precision) from public, anon;
grant execute on function public.my_nearby_members(max_miles double precision) to authenticated;
revoke execute on function public.my_unread_conversations() from public, anon;
grant execute on function public.my_unread_conversations() to authenticated;
revoke execute on function public.my_unread_notification_count() from public, anon;
grant execute on function public.my_unread_notification_count() to authenticated;
revoke execute on function public.nearby_supply_posts(max_miles integer) from public, anon;
grant execute on function public.nearby_supply_posts(max_miles integer) to authenticated;
revoke execute on function public.notify_community_comment() from public, anon, authenticated;
revoke execute on function public.notify_community_support() from public, anon, authenticated;
revoke execute on function public.notify_help_request() from public, anon, authenticated;
revoke execute on function public.notify_help_response() from public, anon, authenticated;
revoke execute on function public.notify_message_push() from public, anon, authenticated;
revoke execute on function public.notify_supply_match() from public, anon, authenticated;
revoke execute on function public.parent_comment_matches_post(parent_id uuid, target_post_id uuid) from public, anon;
grant execute on function public.parent_comment_matches_post(parent_id uuid, target_post_id uuid) to authenticated;
revoke execute on function public.queue_notification_push() from public, anon, authenticated;
revoke execute on function public.renew_help_request(req_id uuid) from public, anon;
grant execute on function public.renew_help_request(req_id uuid) to authenticated;
revoke execute on function public.renew_supply_post(post_id uuid) from public, anon;
grant execute on function public.renew_supply_post(post_id uuid) to authenticated;
revoke execute on function public.search_nearby_public_members(max_miles integer, search_text text, role_filter text, device_filter text, insulin_filter text, experience_filter text, help_filter text, helpers_only boolean) from public, anon;
grant execute on function public.search_nearby_public_members(max_miles integer, search_text text, role_filter text, device_filter text, insulin_filter text, experience_filter text, help_filter text, helpers_only boolean) to authenticated;
revoke execute on function public.search_public_members(search_text text, role_filter text, device_filter text, insulin_filter text, experience_filter text, help_filter text, helpers_only boolean) from public, anon;
grant execute on function public.search_public_members(search_text text, role_filter text, device_filter text, insulin_filter text, experience_filter text, help_filter text, helpers_only boolean) to authenticated;
revoke execute on function public.set_my_approximate_location(lat double precision, lng double precision) from public, anon;
grant execute on function public.set_my_approximate_location(lat double precision, lng double precision) to authenticated;
revoke execute on function public.start_conversation(other_user uuid) from public, anon;
grant execute on function public.start_conversation(other_user uuid) to authenticated;
revoke execute on function public.users_blocked(a uuid, b uuid) from public, anon;
grant execute on function public.users_blocked(a uuid, b uuid) to authenticated;
