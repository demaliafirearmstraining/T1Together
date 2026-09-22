-- Expand structured profile experience fields
alter table public.profiles
  add column if not exists insulins text[] not null default '{}',
  add column if not exists experience_topics text[] not null default '{}';
comment on column public.profiles.insulins is 'Optional public list of insulin brands/types the member has experience with.';
comment on column public.profiles.experience_topics is 'Optional public list of T1D life areas the member has experience with.';
