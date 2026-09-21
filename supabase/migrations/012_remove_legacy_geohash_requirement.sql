-- Migration 010 replaced legacy geohash matching with rounded coordinate buckets.
-- Keep the legacy column for compatibility, but stop requiring new rows to populate it.
alter table public.approximate_locations
  alter column geohash_prefix drop not null;
