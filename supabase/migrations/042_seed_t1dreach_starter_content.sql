-- Seed clearly labeled T1DReach starter/demo content without impersonating real members.
-- Requires one existing profile to be designated as the T1DReach Team owner.
--
-- BEFORE RUNNING:
-- Replace t1demalia@gmail.com with the email address of the account that should own
-- official T1DReach starter content. No auth users or profiles are created here.
--
-- Safe to re-run: existing seeded rows are removed by their deterministic IDs.

do $$
declare
  team_id uuid;
begin
  select id into team_id
  from auth.users
  where lower(email)=lower('t1demalia@gmail.com')
  limit 1;

  if team_id is null then
    raise exception 'No auth user found for t1demalia@gmail.com. Replace the placeholder with an existing T1DReach account email.';
  end if;

  -- Present this account transparently as the official app/community identity.
  update public.profiles
  set display_name='T1DReach Team',
      bio='Official T1DReach community account. Welcome posts, tips, and demo examples from the T1DReach team.',
      role='organization'::public.user_role,
      is_public=true
  where id=team_id;

  -- Remove prior copies of only our deterministic seed records.
  delete from public.help_requests where id in (
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid
  );
  delete from public.supply_posts where id in (
    'd2000000-0000-4000-8000-000000000001'::uuid,
    'd2000000-0000-4000-8000-000000000002'::uuid
  );
  delete from public.posts where id in (
    'd3000000-0000-4000-8000-000000000001'::uuid,
    'd3000000-0000-4000-8000-000000000002'::uuid,
    'd3000000-0000-4000-8000-000000000003'::uuid
  );

  insert into public.posts(id,author_id,body,category,created_at) values
  ('d3000000-0000-4000-8000-000000000001',team_id,
   'Welcome to T1DReach! 💙 This is a community built for people living with Type 1 diabetes, parents and caregivers, families, and supporters. Introduce yourself, share what brought you here, or just say hello. We’re glad you found us.',
   'General',now()-interval '2 hours'),
  ('d3000000-0000-4000-8000-000000000002',team_id,
   'Community question: What is one T1D tip, routine, or piece of gear you wish someone had told you about sooner? Share it below — your experience might make another family’s day a little easier.',
   'Questions',now()-interval '75 minutes'),
  ('d3000000-0000-4000-8000-000000000003',team_id,
   'New here? T1DReach is about connection, not perfection. Community posts are a great place for everyday questions and shared experiences. T1 Beacon is for time-sensitive community help, and Supply Locker helps members connect around available supplies. T1DReach is peer support and is not a substitute for medical or emergency care.',
   'General',now()-interval '30 minutes');

  -- These are deliberately labeled DEMO so testers understand they are examples.
  insert into public.help_requests(id,requester_id,kind,item,details,urgency,radius_miles,status,is_beacon,created_at,expires_at) values
  ('d1000000-0000-4000-8000-000000000001',team_id,'community_help','[DEMO] Backup charging cable',
   'Demo Help request: an example of how a member could ask the nearby T1D community for a non-emergency item while away from home.',
   'today',15,'open',false,now()-interval '20 minutes',now()+interval '1 day'),
  ('d1000000-0000-4000-8000-000000000002',team_id,'time_sensitive','[DEMO] T1 Beacon example',
   'Demo T1 Beacon: this shows how a time-sensitive community request appears. For an actual medical emergency, contact emergency services.',
   'now',15,'open',true,now()-interval '10 minutes',now()+interval '6 hours');

  insert into public.supply_posts(id,owner_id,post_type,category,item_name,device_family,quantity,details,radius_miles,status,created_at,expires_at) values
  ('d2000000-0000-4000-8000-000000000001',team_id,'offer','CGM','[DEMO] CGM overpatches','General',3,
   'Demo Supply Locker offer showing how an available item can appear. Not a real offer.',15,'open',now()-interval '40 minutes',now()+interval '14 days'),
  ('d2000000-0000-4000-8000-000000000002',team_id,'need','Pump supplies','[DEMO] Pump charging cable','General',1,
   'Demo Supply Locker request showing how a member need can appear. Not a real request.',15,'open',now()-interval '25 minutes',now()+interval '14 days');
end $$;
