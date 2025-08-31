-- =====================================================
-- Migration: 002 - Setup Row Level Security Policies
-- Description: Configures RLS policies to ensure data isolation between users
-- Dependencies: Requires 001_create_todos_table.sql
-- =====================================================

BEGIN;

-- Ensure RLS is enabled (should already be done in 001)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can only see their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only delete their own todos" ON public.todos;

-- Policy 1: SELECT - Users can only view their own todos
CREATE POLICY "Users can only see their own todos" 
ON public.todos 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 2: INSERT - Users can only create todos for themselves
CREATE POLICY "Users can only insert their own todos" 
ON public.todos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - Users can only update their own todos
CREATE POLICY "Users can only update their own todos" 
ON public.todos 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Users can only delete their own todos
CREATE POLICY "Users can only delete their own todos" 
ON public.todos 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Deny all access to anonymous users (extra security)
CREATE POLICY "Deny anonymous access to todos"
ON public.todos
FOR ALL
TO anon
USING (false);

-- Grant usage on the auth schema functions (required for auth.uid())
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Verify policies are created correctly
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'todos' AND schemaname = 'public';
    
    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Expected at least 4 RLS policies, but found %', policy_count;
    END IF;
    
    RAISE NOTICE 'Successfully created % RLS policies for todos table', policy_count;
END
$$;

-- Test the policies with a sample query (will only work if user is authenticated)
-- This is commented out as it requires an authenticated session
/*
-- Test query (uncomment to test with authenticated user):
-- SELECT 
--     'RLS Test' as test_type,
--     COUNT(*) as accessible_todos 
-- FROM public.todos;
*/

COMMIT;

-- Notes for manual policy removal (if needed):
-- DROP POLICY "Users can only see their own todos" ON public.todos;
-- DROP POLICY "Users can only insert their own todos" ON public.todos;
-- DROP POLICY "Users can only update their own todos" ON public.todos;
-- DROP POLICY "Users can only delete their own todos" ON public.todos;
-- DROP POLICY "Deny anonymous access to todos" ON public.todos;