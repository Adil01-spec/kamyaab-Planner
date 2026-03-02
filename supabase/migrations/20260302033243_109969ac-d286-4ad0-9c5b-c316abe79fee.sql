
-- Create plan_invites table for token-based invite flow
CREATE TABLE public.plan_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  collaborator_email text NOT NULL,
  role public.collaborator_role NOT NULL DEFAULT 'viewer'::public.collaborator_role,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plan_invites_token_key UNIQUE (token),
  CONSTRAINT plan_invites_plan_email_key UNIQUE (plan_id, collaborator_email)
);

-- Enable RLS
ALTER TABLE public.plan_invites ENABLE ROW LEVEL SECURITY;

-- Owners can insert invites
CREATE POLICY "Owners can insert invites"
  ON public.plan_invites
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can view their own invites
CREATE POLICY "Owners can view their invites"
  ON public.plan_invites
  FOR SELECT
  USING (owner_id = auth.uid());

-- Owners can delete their invites (cancel pending)
CREATE POLICY "Owners can delete their invites"
  ON public.plan_invites
  FOR DELETE
  USING (owner_id = auth.uid());

-- Owners can update their invites (for edge function via service role, but also owner)
CREATE POLICY "Owners can update their invites"
  ON public.plan_invites
  FOR UPDATE
  USING (owner_id = auth.uid());
