-- Automatic push dispatcher using pg_cron + pg_net.
-- Requires PUSH_DISPATCH_SECRET to be stored in Supabase Vault as push_dispatch_secret.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare existing_job bigint;
begin
 select jobid into existing_job from cron.job where jobname='t1together-push-dispatch' limit 1;
 if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
 't1together-push-dispatch',
 '* * * * *',
 $$
 select net.http_post(
  url := 'https://ovjjrjsupnehjtkalaho.supabase.co/functions/v1/push-dispatch',
  headers := jsonb_build_object(
   'Content-Type','application/json',
   'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='push_dispatch_secret' limit 1)
  ),
  body := '{}'::jsonb
 );
 $$
);
