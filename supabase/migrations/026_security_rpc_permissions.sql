-- Production hardening pass 1: tighten RPC execution permissions
-- Client-facing RPCs are authenticated-only; internal trigger functions are not callable by clients.

revoke all on function public.search_public_members(text,text,text,text,text,text,boolean) from public;
grant execute on function public.search_public_members(text,text,text,text,text,text,boolean) to authenticated;

revoke all on function public.is_profile_visible(uuid) from public;
grant execute on function public.is_profile_visible(uuid) to authenticated;

revoke all on function public.nearby_supply_posts(integer) from public;
grant execute on function public.nearby_supply_posts(integer) to authenticated;

revoke all on function public.renew_supply_post(uuid) from public;
grant execute on function public.renew_supply_post(uuid) to authenticated;

revoke all on function public.renew_help_request(uuid) from public;
grant execute on function public.renew_help_request(uuid) to authenticated;

revoke all on function public.my_help_activity() from public;
grant execute on function public.my_help_activity() to authenticated;

revoke all on function public.community_post_stats() from public;
grant execute on function public.community_post_stats() to authenticated;

revoke all on function public.notify_supply_match() from public;
revoke all on function public.set_help_expiration() from public;
