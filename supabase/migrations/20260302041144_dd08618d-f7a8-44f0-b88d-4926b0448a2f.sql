
-- Add soft auth columns to plan_invites
ALTER TABLE public.plan_invites 
  ADD COLUMN access_key_hash text,
  ADD COLUMN access_key_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN locked_until timestamptz;

-- Create soft_collab_sessions table
CREATE TABLE public.soft_collab_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  invite_id uuid NOT NULL REFERENCES public.plan_invites(id),
  email text NOT NULL,
  role public.collaborator_role NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS but NO public policies (all access via service role in edge functions)
ALTER TABLE public.soft_collab_sessions ENABLE ROW LEVEL SECURITY;
