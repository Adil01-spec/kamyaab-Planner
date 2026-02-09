-- Fix plan_collaborators RLS policies for proper access control
-- Drop existing SELECT policies and recreate as PERMISSIVE with proper restrictions

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Owners can select their collaborators" ON public.plan_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their access" ON public.plan_collaborators;

-- Create a single, properly scoped PERMISSIVE SELECT policy
-- Users can only see records where:
-- 1. They are the owner (owner_id = auth.uid())
-- 2. They are the collaborator by user_id (collaborator_user_id = auth.uid())
-- 3. They are the collaborator by email (collaborator_email matches their auth email)
CREATE POLICY "Users can view relevant collaborator records"
ON public.plan_collaborators
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR collaborator_user_id = auth.uid() 
  OR collaborator_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);