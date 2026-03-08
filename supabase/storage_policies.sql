-- Storage Policies for Profile Picture Upload
-- Run this SQL in Supabase SQL Editor

-- 1. Allow authenticated users to insert (upload) files to avatars bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 2. Allow authenticated users to update files in avatars bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated updates to avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 3. Allow authenticated users to delete files from avatars bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. Allow public to read (view) files from avatars bucket
CREATE POLICY IF NOT EXISTS "Allow public to view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%avatars%';
