-- Create plan_history table for archiving completed plans
CREATE TABLE public.plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Plan identification
  plan_title TEXT NOT NULL,
  plan_description TEXT,
  is_strategic BOOLEAN DEFAULT false,
  scenario_tag TEXT,
  
  -- Date range
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  
  -- Summary metrics (denormalized for quick display)
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  total_weeks INTEGER NOT NULL,
  total_time_seconds BIGINT DEFAULT 0,
  
  -- Full plan snapshot for detailed comparison
  plan_snapshot JSONB NOT NULL,
  
  -- Cached comparison insights (AI-generated)
  comparison_insights JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_history ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own history
CREATE POLICY "Users can view their own plan history"
  ON public.plan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan history"
  ON public.plan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan history"
  ON public.plan_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for efficient user lookups
CREATE INDEX idx_plan_history_user_id ON public.plan_history(user_id);
CREATE INDEX idx_plan_history_completed_at ON public.plan_history(user_id, completed_at DESC);