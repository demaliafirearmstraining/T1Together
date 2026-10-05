-- REVIEW PROPOSAL ONLY. Not a migration; nothing in this file was deployed.
-- Test against a disposable schema copy, compare EXPLAIN plans, and obtain explicit
-- production approval before executing each statement in a maintenance session.
-- CONCURRENTLY must run outside a transaction. Do not use `supabase db push`:
-- historical manual migrations include destructive prelaunch cleanup.
-- IF NOT EXISTS only compares names; inspect any existing equivalent index first.

-- Primary read paths; leading columns also cover their foreign keys.
create index concurrently if not exists messages_conversation_created_id_idx on public.messages(conversation_id,created_at desc,id desc);
create index concurrently if not exists messages_sender_idx on public.messages(sender_id);
create index concurrently if not exists conversation_members_user_conversation_idx on public.conversation_members(user_id,conversation_id);
create index concurrently if not exists posts_created_id_idx on public.posts(created_at desc,id desc);
create index concurrently if not exists posts_author_created_id_idx on public.posts(author_id,created_at desc,id desc);
create index concurrently if not exists post_comments_post_created_id_idx on public.post_comments(post_id,created_at,id);
create index concurrently if not exists post_comments_author_idx on public.post_comments(author_id);
create index concurrently if not exists notifications_unread_user_kind_idx on public.notifications(user_id,kind) where read_at is null;
create index concurrently if not exists help_requests_requester_created_idx on public.help_requests(requester_id,created_at desc);
create index concurrently if not exists supply_posts_owner_created_idx on public.supply_posts(owner_id,created_at desc);
create index concurrently if not exists supply_posts_open_category_expiry_idx on public.supply_posts(category,expires_at) where status='open';

-- Reverse foreign-key lookups used by block checks and account/content deletion.
create index concurrently if not exists blocks_blocked_blocker_idx on public.blocks(blocked_id,blocker_id);
create index concurrently if not exists beacon_responses_responder_request_idx on public.beacon_responses(responder_id,request_id);
create index concurrently if not exists post_bookmarks_post_idx on public.post_bookmarks(post_id);
create index concurrently if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index concurrently if not exists push_outbox_user_idx on public.push_outbox(user_id);
create index concurrently if not exists reports_reporter_idx on public.reports(reporter_id);

-- Existing group, follow, comment-reaction and pending-outbox indexes are retained.
-- No index WHERE predicate uses now(): changing time must remain a query filter.
-- Category/trigram/array and spatial indexes need actual selective query plans
-- before approval; a plain bucket index cannot accelerate distance_miles() alone.
