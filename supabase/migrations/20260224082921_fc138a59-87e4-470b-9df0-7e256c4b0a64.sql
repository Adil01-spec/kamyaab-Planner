ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_memory jsonb DEFAULT NULL;