-- Add subscription fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_tier TEXT DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'student', 'pro', 'business'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_provider TEXT DEFAULT NULL;