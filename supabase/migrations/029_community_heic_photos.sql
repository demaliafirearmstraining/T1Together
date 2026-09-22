-- Allow native iPhone HEIC/HEIF photos in Community posts
update storage.buckets
set allowed_mime_types=array['image/jpeg','image/png','image/webp','image/heic','image/heif']
where id='community-posts';
