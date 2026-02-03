-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON review_feedback;

-- Create a more restrictive policy that validates the shared review exists and is valid
-- This ensures feedback can only be submitted for valid, non-expired, non-revoked shares
CREATE POLICY "Anyone can submit feedback for valid shares"
ON review_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_reviews
    WHERE shared_reviews.id = shared_review_id
      AND shared_reviews.revoked = false
      AND shared_reviews.expires_at > now()
  )
);