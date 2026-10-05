-- Evaluate the request identity once per statement; ownership/block predicates stay identical.
set local lock_timeout = '2s';
set local statement_timeout = '15s';
alter policy "profile own update" on "public"."profiles" using (((select auth.uid()) = id));
alter policy "posts insert own" on "public"."posts" with check (((select auth.uid()) = author_id));
alter policy "help insert own" on "public"."help_requests" with check (((select auth.uid()) = requester_id));
alter policy "blocks own" on "public"."blocks" using ((blocker_id = (select auth.uid()))) with check ((blocker_id = (select auth.uid())));
alter policy "reports own insert" on "public"."reports" with check ((reporter_id = (select auth.uid())));
alter policy "reactions own" on "public"."post_reactions" using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));
alter policy "help update own" on "public"."help_requests" using (((select auth.uid()) = requester_id)) with check (((select auth.uid()) = requester_id));
alter policy "responses participant read" on "public"."beacon_responses" using (((responder_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM help_requests h
  WHERE ((h.id = beacon_responses.request_id) AND (h.requester_id = (select auth.uid())))))));
alter policy "posts delete own" on "public"."posts" using (((select auth.uid()) = author_id));
alter policy "reports own read" on "public"."reports" using ((reporter_id = (select auth.uid())));
alter policy "profiles read block aware" on "public"."profiles" using (((id = (select auth.uid())) OR (NOT users_blocked((select auth.uid()), id))));
alter policy "posts read block aware" on "public"."posts" using (((author_id = (select auth.uid())) OR (NOT users_blocked((select auth.uid()), author_id))));
alter policy "help read block aware" on "public"."help_requests" using (((requester_id = (select auth.uid())) OR (NOT users_blocked((select auth.uid()), requester_id))));
alter policy "comments read block aware" on "public"."post_comments" using (((author_id = (select auth.uid())) OR (NOT users_blocked((select auth.uid()), author_id))));
alter policy "bookmarks own select" on "public"."post_bookmarks" using ((user_id = (select auth.uid())));
alter policy "bookmarks own insert" on "public"."post_bookmarks" with check ((user_id = (select auth.uid())));
alter policy "bookmarks own delete" on "public"."post_bookmarks" using ((user_id = (select auth.uid())));
alter policy "conversation members own update" on "public"."conversation_members" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "messages member insert" on "public"."messages" with check (((sender_id = (select auth.uid())) AND can_message(conversation_id)));
alter policy "response update own" on "public"."beacon_responses" using ((responder_id = (select auth.uid()))) with check ((responder_id = (select auth.uid())));
alter policy "notifications own read" on "public"."notifications" using ((user_id = (select auth.uid())));
alter policy "notifications own update" on "public"."notifications" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "push tokens own read" on "public"."push_tokens" using ((user_id = (select auth.uid())));
alter policy "push tokens own insert" on "public"."push_tokens" with check ((user_id = (select auth.uid())));
alter policy "push tokens own update" on "public"."push_tokens" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "push tokens own delete" on "public"."push_tokens" using ((user_id = (select auth.uid())));
alter policy "avatar own insert" on "storage"."objects" with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
alter policy "avatar own update" on "storage"."objects" using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text))) with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
alter policy "avatar own delete" on "storage"."objects" using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
alter policy "supply posts read" on "public"."supply_posts" using (((owner_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = supply_posts.owner_id) AND (p.is_public = true))))));
alter policy "supply posts insert own" on "public"."supply_posts" with check ((owner_id = (select auth.uid())));
alter policy "supply posts delete own" on "public"."supply_posts" using ((owner_id = (select auth.uid())));
alter policy "comments delete own or post owner" on "public"."post_comments" using (((author_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_comments.post_id) AND (p.author_id = (select auth.uid())))))));
alter policy "approx location own insert" on "public"."approximate_locations" with check ((user_id = (select auth.uid())));
alter policy "approx location own update" on "public"."approximate_locations" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "response insert eligible" on "public"."beacon_responses" with check (((responder_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM help_requests h
  WHERE ((h.id = beacon_responses.request_id) AND (h.requester_id <> (select auth.uid())) AND (h.status = 'open'::help_status) AND ((h.expires_at IS NULL) OR (h.expires_at > now())) AND (NOT users_blocked((select auth.uid()), h.requester_id)))))));
alter policy "posts update own" on "public"."posts" using ((author_id = (select auth.uid()))) with check ((author_id = (select auth.uid())));
alter policy "supply posts update own" on "public"."supply_posts" using ((owner_id = (select auth.uid()))) with check ((owner_id = (select auth.uid())));
alter policy "community photo own insert" on "storage"."objects" with check (((bucket_id = 'community-posts'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
alter policy "community photo own delete" on "storage"."objects" using (((bucket_id = 'community-posts'::text) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
alter policy "comments insert own" on "public"."post_comments" with check (((author_id = (select auth.uid())) AND parent_comment_matches_post(parent_comment_id, post_id)));
