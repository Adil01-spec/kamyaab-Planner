
-- Create a trigger function that blocks non-service-role users from modifying sensitive fields
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow service_role to modify anything (used by edge functions & admin)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to subscription/billing fields
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot modify subscription_tier directly';
  END IF;
  IF NEW.subscription_state IS DISTINCT FROM OLD.subscription_state THEN
    RAISE EXCEPTION 'Cannot modify subscription_state directly';
  END IF;
  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Cannot modify subscription_expires_at directly';
  END IF;
  IF NEW.subscription_provider IS DISTINCT FROM OLD.subscription_provider THEN
    RAISE EXCEPTION 'Cannot modify subscription_provider directly';
  END IF;
  IF NEW.grace_ends_at IS DISTINCT FROM OLD.grace_ends_at THEN
    RAISE EXCEPTION 'Cannot modify grace_ends_at directly';
  END IF;
  IF NEW.pending_plan_tier IS DISTINCT FROM OLD.pending_plan_tier THEN
    RAISE EXCEPTION 'Cannot modify pending_plan_tier directly';
  END IF;
  IF NEW.pending_expires_at IS DISTINCT FROM OLD.pending_expires_at THEN
    RAISE EXCEPTION 'Cannot modify pending_expires_at directly';
  END IF;

  -- Block changes to strategic access fields
  IF NEW.strategic_trial_used IS DISTINCT FROM OLD.strategic_trial_used THEN
    RAISE EXCEPTION 'Cannot modify strategic_trial_used directly';
  END IF;
  IF NEW.strategic_access_level IS DISTINCT FROM OLD.strategic_access_level THEN
    RAISE EXCEPTION 'Cannot modify strategic_access_level directly';
  END IF;
  IF NEW.strategic_calls_lifetime IS DISTINCT FROM OLD.strategic_calls_lifetime THEN
    RAISE EXCEPTION 'Cannot modify strategic_calls_lifetime directly';
  END IF;
  IF NEW.strategic_last_call_at IS DISTINCT FROM OLD.strategic_last_call_at THEN
    RAISE EXCEPTION 'Cannot modify strategic_last_call_at directly';
  END IF;

  -- Block changes to email verification fields
  IF NEW.email_domain_type IS DISTINCT FROM OLD.email_domain_type THEN
    RAISE EXCEPTION 'Cannot modify email_domain_type directly';
  END IF;
  IF NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at THEN
    RAISE EXCEPTION 'Cannot modify email_verified_at directly';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger to profiles table
CREATE TRIGGER guard_profile_sensitive_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_fields();
