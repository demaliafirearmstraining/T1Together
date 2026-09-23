-- Clean pre-launch test activity while preserving all auth users and profiles.
-- This intentionally does NOT delete accounts, profile/onboarding data, push tokens,
-- approximate locations, or notification preferences.
--
-- Run manually in the Supabase SQL Editor. Historical migrations were applied
-- manually, so do not use "supabase db push" for this project.

begin;

-- Conversation/test interaction data
delete from public.messages;
delete from public.conversation_members;
delete from public.conversations;

-- Moderation/test relationships
delete from public.reports;
delete from public.blocks;

-- Help / T1 Beacon activity (responses cascade when requests are deleted)
delete from public.beacon_responses;
delete from public.help_requests;

-- Supply Locker activity
delete from public.supply_posts;

-- Community activity. Child rows are explicitly cleared first for compatibility
-- with every currently deployed schema revision.
delete from public.post_bookmarks;
delete from public.post_reactions;
delete from public.post_comments;
delete from public.posts;

-- Old activity notifications should not survive the content they referenced.
delete from public.notifications;

commit;
