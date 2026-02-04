-- Create collaboration role type
CREATE TYPE public.collaborator_role AS ENUM ('viewer', 'commenter');

-- Table: plan_collaborators
CREATE TABLE public.plan_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collaborator_email text NOT NULL,
  collaborator_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role collaborator_role NOT NULL DEFAULT 'viewer',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz NULL,
  UNIQUE(plan_id, collaborator_email)
);

-- Table: plan_comments
CREATE TABLE public.plan_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('plan', 'task', 'insight')),
  target_ref text NULL,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz NULL,
  deleted_at timestamptz NULL
);

-- Enable RLS
ALTER TABLE public.plan_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;

-- Security definer function: Check if user can view a plan (owner OR collaborator)
CREATE OR REPLACE FUNCTION public.can_view_plan(_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM plans WHERE id = _plan_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM plan_collaborators 
    WHERE plan_id = _plan_id 
      AND (collaborator_user_id = auth.uid() 
           OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
$$;

-- Security definer function: Check if user can comment on a plan
CREATE OR REPLACE FUNCTION public.can_comment_on_plan(_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM plans WHERE id = _plan_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM plan_collaborators 
    WHERE plan_id = _plan_id 
      AND role = 'commenter'
      AND (collaborator_user_id = auth.uid() 
           OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
$$;

-- Security definer function: Get user's collaboration role for a plan
CREATE OR REPLACE FUNCTION public.get_collaboration_role(_plan_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM plans WHERE id = _plan_id AND user_id = auth.uid()) THEN 'owner'
      ELSE (
        SELECT role::text FROM plan_collaborators 
        WHERE plan_id = _plan_id 
          AND (collaborator_user_id = auth.uid() 
               OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        LIMIT 1
      )
    END
$$;

-- RLS Policies for plan_collaborators

-- Owners can manage their collaborators
CREATE POLICY "Owners can select their collaborators"
ON public.plan_collaborators
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert collaborators"
ON public.plan_collaborators
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their collaborators"
ON public.plan_collaborators
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their collaborators"
ON public.plan_collaborators
FOR DELETE
USING (owner_id = auth.uid());

-- Collaborators can see their own collaboration records
CREATE POLICY "Collaborators can view their access"
ON public.plan_collaborators
FOR SELECT
USING (
  collaborator_user_id = auth.uid() 
  OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- RLS Policies for plan_comments

-- Users can view comments on plans they can access
CREATE POLICY "Users can view comments on accessible plans"
ON public.plan_comments
FOR SELECT
USING (
  can_view_plan(plan_id) AND deleted_at IS NULL
);

-- Users can insert comments on plans they can comment on
CREATE POLICY "Users can insert comments"
ON public.plan_comments
FOR INSERT
WITH CHECK (
  can_comment_on_plan(plan_id) AND author_id = auth.uid()
);

-- Authors can update their own comments
CREATE POLICY "Authors can update their comments"
ON public.plan_comments
FOR UPDATE
USING (author_id = auth.uid());

-- Authors can soft-delete their own comments
CREATE POLICY "Authors can delete their comments"
ON public.plan_comments
FOR DELETE
USING (author_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_plan_collaborators_plan_id ON public.plan_collaborators(plan_id);
CREATE INDEX idx_plan_collaborators_email ON public.plan_collaborators(collaborator_email);
CREATE INDEX idx_plan_collaborators_user_id ON public.plan_collaborators(collaborator_user_id);
CREATE INDEX idx_plan_comments_plan_id ON public.plan_comments(plan_id);
CREATE INDEX idx_plan_comments_author_id ON public.plan_comments(author_id);
CREATE INDEX idx_plan_comments_target ON public.plan_comments(target_type, target_ref);