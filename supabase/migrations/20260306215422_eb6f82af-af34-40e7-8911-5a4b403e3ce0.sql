
-- Create subscriptions table for lifecycle tracking
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_tier text NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  grace_end timestamptz,
  payment_source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- Add RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Add subscription_id to manual_payments
ALTER TABLE public.manual_payments ADD COLUMN subscription_id uuid REFERENCES public.subscriptions(id);
