-- Add subscription state and grace period columns to profiles
-- Using text type for subscription_state for flexibility with Supabase types

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_state text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS grace_ends_at timestamp with time zone;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.subscription_state IS 'Current subscription lifecycle state: active, trial, grace, canceled, expired';
COMMENT ON COLUMN public.profiles.grace_ends_at IS 'End of grace period after failed payment';