-- Community post photos (single image per post)
alter table public.posts add column if not exists image_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-posts','community-posts',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "community photo authenticated read" on storage.objects;
create policy "community photo authenticated read" on storage.objects
for select to authenticated using(bucket_id='community-posts');

drop policy if exists "community photo own insert" on storage.objects;
create policy "community photo own insert" on storage.objects
for insert to authenticated with check(bucket_id='community-posts' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "community photo own delete" on storage.objects;
create policy "community photo own delete" on storage.objects
for delete to authenticated using(bucket_id='community-posts' and (storage.foldername(name))[1]=auth.uid()::text);
