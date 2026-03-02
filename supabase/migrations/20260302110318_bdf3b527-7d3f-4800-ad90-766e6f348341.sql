
-- 1. soft_feedback table
CREATE TABLE public.soft_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.soft_collab_sessions(id) ON DELETE CASCADE,
  email text NOT NULL,
  target_type text NOT NULL,
  target_ref text,
  content text,
  strategy_score smallint,
  feasibility_score smallint,
  execution_score smallint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.soft_feedback ENABLE ROW LEVEL SECURITY;

-- Owner can read feedback on their plans
CREATE POLICY "Owners can view feedback on their plans"
  ON public.soft_feedback
  FOR SELECT
  USING (plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid()));

-- 2. plan_suggestions table
CREATE TABLE public.plan_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.soft_collab_sessions(id) ON DELETE CASCADE,
  email text NOT NULL,
  suggestion_type text NOT NULL,
  target_ref text,
  title text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_suggestions ENABLE ROW LEVEL SECURITY;

-- Owner can read suggestions on their plans
CREATE POLICY "Owners can view suggestions on their plans"
  ON public.plan_suggestions
  FOR SELECT
  USING (plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid()));

-- Owner can update suggestions (approve/reject)
CREATE POLICY "Owners can update suggestions on their plans"
  ON public.plan_suggestions
  FOR UPDATE
  USING (plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid()));
