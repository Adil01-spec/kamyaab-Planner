-- Add email verification and strategic access columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_domain_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS strategic_trial_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS strategic_access_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS strategic_calls_lifetime INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strategic_last_call_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_plan_completed_at TIMESTAMP WITH TIME ZONE;

-- Create email verifications table for OTP storage
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS for email_verifications
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own verification records
CREATE POLICY "Users can insert their own verifications"
  ON public.email_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own verification records
CREATE POLICY "Users can view their own verifications"
  ON public.email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own verification records
CREATE POLICY "Users can delete their own verifications"
  ON public.email_verifications FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own verification records
CREATE POLICY "Users can update their own verifications"
  ON public.email_verifications FOR UPDATE
  USING (auth.uid() = user_id);