-- Fix: Restrict shared_reviews SELECT to owners only
-- Public access will go through an edge function for token validation

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared reviews" ON public.shared_reviews;

-- Create a restrictive policy: only owners can SELECT their own rows
CREATE POLICY "Owners can view their own shares"
ON public.shared_reviews
FOR SELECT
USING (auth.uid() = user_id);