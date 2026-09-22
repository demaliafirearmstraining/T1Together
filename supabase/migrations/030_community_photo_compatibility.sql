-- Normalize Community post photos to browser/device-friendly JPEG/PNG/WebP.
-- HEIC/HEIF uploads already stored remain readable, but new app uploads are converted client-side.
update storage.buckets
set allowed_mime_types=array['image/jpeg','image/png','image/webp','image/heic','image/heif']
where id='community-posts';
