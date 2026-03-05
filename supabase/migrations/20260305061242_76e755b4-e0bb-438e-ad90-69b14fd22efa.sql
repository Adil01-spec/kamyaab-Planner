
-- Create manual_payments table
CREATE TABLE public.manual_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  plan_tier text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'PKR',
  payment_method text NOT NULL,
  transaction_id text,
  screenshot_url text,
  status text DEFAULT 'pending',
  admin_notes text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- Indexes
CREATE INDEX idx_manual_payments_user_id ON public.manual_payments(user_id);
CREATE INDEX idx_manual_payments_status ON public.manual_payments(status);

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own payments"
  ON public.manual_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON public.manual_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add pending fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_plan_tier text,
  ADD COLUMN IF NOT EXISTS pending_expires_at timestamptz;

-- Create payment_proofs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment_proofs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own payment proofs
CREATE POLICY "Users can view own payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
