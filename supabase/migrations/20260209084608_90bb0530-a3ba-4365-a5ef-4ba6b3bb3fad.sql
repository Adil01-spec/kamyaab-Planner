-- Add RLS policy to prevent strategic plan abuse via direct API inserts
-- This ensures even direct Supabase client calls cannot insert strategic plans without proper access

CREATE POLICY "prevent_strategic_plan_abuse"
ON public.plans
FOR INSERT
WITH CHECK (
  -- Allow non-strategic plans (plan_json is null, or is_strategic_plan is not true)
  (plan_json IS NULL)
  OR ((plan_json->>'is_strategic_plan')::boolean IS NOT TRUE)
  -- Or if it IS a strategic plan, user must have access
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND (
        -- Paid users have full access
        (subscription_tier IS DISTINCT FROM 'standard' AND subscription_state = 'active')
        -- Or standard users with unused trial
        OR (strategic_trial_used IS NOT TRUE)
      )
  )
);