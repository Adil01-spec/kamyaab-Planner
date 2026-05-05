-- Make soft_collab_sessions.plan_id cascade on plan delete so users can regenerate plans
ALTER TABLE public.soft_collab_sessions
  DROP CONSTRAINT IF EXISTS soft_collab_sessions_plan_id_fkey;

ALTER TABLE public.soft_collab_sessions
  ADD CONSTRAINT soft_collab_sessions_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;
