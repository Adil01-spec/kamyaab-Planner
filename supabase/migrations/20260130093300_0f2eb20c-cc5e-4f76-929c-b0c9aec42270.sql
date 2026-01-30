-- Create shared_reviews table for shareable plan review links
CREATE TABLE public.shared_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  plan_snapshot JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.shared_reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Owners can manage their shares (insert, update, delete)
CREATE POLICY "Owners can insert their shares"
  ON shared_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their shares"
  ON shared_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their shares"
  ON shared_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public select by token (for viewers) - anyone can view
CREATE POLICY "Anyone can view shared reviews"
  ON shared_reviews FOR SELECT
  USING (true);

-- Create review_feedback table for structured feedback from viewers
CREATE TABLE public.review_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_review_id UUID NOT NULL REFERENCES shared_reviews(id) ON DELETE CASCADE,
  feels_realistic TEXT CHECK (feels_realistic IN ('yes', 'somewhat', 'no')),
  challenge_areas TEXT[],
  unclear_or_risky TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can insert feedback (no auth required for viewers)
CREATE POLICY "Anyone can submit feedback"
  ON review_feedback FOR INSERT
  WITH CHECK (true);

-- Owners can read feedback for their reviews via a security definer function
CREATE OR REPLACE FUNCTION public.owns_shared_review(_shared_review_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_reviews
    WHERE id = _shared_review_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Owners can read their feedback"
  ON review_feedback FOR SELECT
  USING (public.owns_shared_review(shared_review_id));

-- Add indexes for performance
CREATE INDEX idx_shared_reviews_token ON shared_reviews(token);
CREATE INDEX idx_shared_reviews_user_id ON shared_reviews(user_id);
CREATE INDEX idx_shared_reviews_plan_id ON shared_reviews(plan_id);
CREATE INDEX idx_review_feedback_shared_review_id ON review_feedback(shared_review_id);