-- Create article-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Allow admins to upload to article-images
CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' AND public.is_admin_email()
);

-- Allow admins to update article images
CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' AND public.is_admin_email()
);

-- Allow admins to delete article images
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images' AND public.is_admin_email()
);

-- Allow public read access to article images
CREATE POLICY "Public can read article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- Add alt text column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS cover_image_alt text;