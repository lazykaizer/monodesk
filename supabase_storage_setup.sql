-- ############################################################
-- # PITCH DECK IMAGES STORAGE PERMISSIONS FIX
-- ############################################################
-- # Run this in your Supabase SQL Editor to fix the "disappearing images" issue.
-- # This ensures images are publicly viewable but only editable by the owner.
-- ############################################################

-- 1. Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'pitch_deck_images';

-- 2. Allow PUBLIC READ access (Critical for images to show in browser)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pitch_deck_images');

-- 3. Allow AUTHENTICATED users to upload/insert
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pitch_deck_images');

-- 4. Allow AUTHENTICATED users to update their own files
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'pitch_deck_images');

-- 5. Allow AUTHENTICATED users to delete their own files
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'pitch_deck_images');
