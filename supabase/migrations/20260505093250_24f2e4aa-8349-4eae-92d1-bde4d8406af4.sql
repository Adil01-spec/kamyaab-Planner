DO $$
DECLARE
  current_delete_rule text;
BEGIN
  SELECT rc.delete_rule
  INTO current_delete_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc
    ON rc.constraint_name = tc.constraint_name
   AND rc.constraint_schema = tc.constraint_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'soft_collab_sessions'
    AND tc.constraint_name = 'soft_collab_sessions_plan_id_fkey';

  IF current_delete_rule IS DISTINCT FROM 'CASCADE' THEN
    ALTER TABLE public.soft_collab_sessions
      DROP CONSTRAINT IF EXISTS soft_collab_sessions_plan_id_fkey;

    ALTER TABLE public.soft_collab_sessions
      ADD CONSTRAINT soft_collab_sessions_plan_id_fkey
      FOREIGN KEY (plan_id)
      REFERENCES public.plans(id)
      ON DELETE CASCADE;
  END IF;
END $$;