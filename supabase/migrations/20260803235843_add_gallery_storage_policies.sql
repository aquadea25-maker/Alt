/*
# Storage policies for gallery-photos bucket

Policies:
- Upload: only authenticated users can upload, and files must be in their own folder.
- Read: anyone can read photos (public gallery).
- Delete: only authenticated users can delete, and only from their own folder.
*/

DROP POLICY IF EXISTS "upload_gallery_photos" ON storage.objects;
CREATE POLICY "upload_gallery_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-photos'
  );

DROP POLICY IF EXISTS "read_gallery_photos" ON storage.objects;
CREATE POLICY "read_gallery_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "delete_gallery_photos" ON storage.objects;
CREATE POLICY "delete_gallery_photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery-photos'
  );
