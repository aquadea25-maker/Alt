/*
# Storage policies for gallery-photos bucket
# Allow anon + authenticated to upload, read, and delete photos.
*/

DROP POLICY IF EXISTS "anon_upload_gallery_photos" ON storage.objects;
CREATE POLICY "anon_upload_gallery_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "anon_read_gallery_photos" ON storage.objects;
CREATE POLICY "anon_read_gallery_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "anon_delete_gallery_photos" ON storage.objects;
CREATE POLICY "anon_delete_gallery_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gallery-photos');
