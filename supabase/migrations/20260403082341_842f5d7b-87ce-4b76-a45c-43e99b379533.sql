-- Add RLS policies to soft_collab_sessions
-- This table should only be accessed by service role (edge functions)
-- No authenticated user should directly read/write this table

CREATE POLICY "Deny all select for authenticated users"
ON public.soft_collab_sessions
FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "Deny all insert for authenticated users"
ON public.soft_collab_sessions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny all update for authenticated users"
ON public.soft_collab_sessions
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny all delete for authenticated users"
ON public.soft_collab_sessions
FOR DELETE
TO authenticated
USING (false);

-- Also deny for anon role
CREATE POLICY "Deny all select for anon users"
ON public.soft_collab_sessions
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny all insert for anon users"
ON public.soft_collab_sessions
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny all update for anon users"
ON public.soft_collab_sessions
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny all delete for anon users"
ON public.soft_collab_sessions
FOR DELETE
TO anon
USING (false);