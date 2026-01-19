-- Migration: Create storage bucket for product images
-- Date: 2026-01-19
-- Description: Creates and configures storage bucket for product images

-- Create bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can read images
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: Service role can upload images
CREATE POLICY IF NOT EXISTS "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'service_role'
);

-- Policy: Service role can update images
CREATE POLICY IF NOT EXISTS "Service Role Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'service_role'
);

-- Policy: Service role can delete images
CREATE POLICY IF NOT EXISTS "Service Role Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'service_role'
);
