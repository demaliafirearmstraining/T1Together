-- Track completion of the first-login profile setup.
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

-- Existing members have already been using T1Together, so don't send them back
-- through first-login setup after this migration.
update public.profiles
set onboarding_completed=true
where onboarding_completed=false
  and created_at < now() - interval '5 minutes';
