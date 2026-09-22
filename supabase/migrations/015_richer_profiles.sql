-- Richer optional community profiles
alter table public.profiles
  add column if not exists diagnosis_year smallint,
  add column if not exists devices text[] not null default '{}',
  add column if not exists help_topics text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_diagnosis_year_check;
alter table public.profiles add constraint profiles_diagnosis_year_check
  check (diagnosis_year is null or (diagnosis_year >= 1920 and diagnosis_year <= 2100));

comment on column public.profiles.diagnosis_year is 'Optional year the member was diagnosed with T1D; primarily for members living with T1D.';
comment on column public.profiles.devices is 'Optional public list of diabetes devices the member has experience with.';
comment on column public.profiles.help_topics is 'Optional public list of community topics the member is comfortable helping with.';
