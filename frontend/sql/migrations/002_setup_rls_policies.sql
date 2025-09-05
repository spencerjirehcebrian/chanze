-- =====================================================
-- Migration: 002 - Setup Row Level Security Policies for Tasks
-- Description: Configures comprehensive RLS policies for task management with templates
-- Dependencies: Requires 001_create_tasks_table.sql
-- =====================================================

BEGIN;

-- Ensure RLS is enabled (should already be done in 001)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can manage their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage task templates" ON public.tasks;
DROP POLICY IF EXISTS "Users can view task templates" ON public.tasks;
DROP POLICY IF EXISTS "Users can create task instances" ON public.tasks;
DROP POLICY IF EXISTS "Deny anonymous access to tasks" ON public.tasks;

-- Core Task Policies

-- Policy 1: SELECT - Users can view their own tasks and templates
CREATE POLICY "Users can view their tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 2: INSERT - Users can create tasks for themselves
CREATE POLICY "Users can create their tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = user_id AND
    -- Additional validation for template/instance relationships
    (
        -- Regular task (not template, not instance)
        (is_template = false AND template_id IS NULL) OR
        -- Template task
        (is_template = true AND template_id IS NULL) OR
        -- Instance task (must reference a valid template owned by same user)
        (is_template = false AND template_id IS NOT NULL AND
         EXISTS (
             SELECT 1 FROM public.tasks t 
             WHERE t.id = template_id 
             AND t.user_id = auth.uid() 
             AND t.is_template = true
         ))
    )
);

-- Policy 3: UPDATE - Users can update their own tasks
CREATE POLICY "Users can update their tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Users can delete their own tasks
CREATE POLICY "Users can delete their tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Template-Specific Policies

-- Policy 5: Template Management - Additional checks for template operations  
CREATE POLICY "Users can manage task templates" 
ON public.tasks 
FOR ALL
TO authenticated 
USING (
    auth.uid() = user_id AND 
    (is_template = true OR template_id IS NOT NULL)
)
WITH CHECK (auth.uid() = user_id);

-- Security Policies

-- Policy 6: Deny all access to anonymous users
CREATE POLICY "Deny anonymous access to tasks"
ON public.tasks
FOR ALL
TO anon
USING (false);

-- Advanced Security Functions

-- Create function to validate template relationships
CREATE OR REPLACE FUNCTION public.validate_task_template_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that template_id references a valid template
    IF NEW.template_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE id = NEW.template_id 
            AND user_id = NEW.user_id 
            AND is_template = true 
            AND is_repeating = true
        ) THEN
            RAISE EXCEPTION 'Invalid template_id: Template does not exist or is not a valid repeating template';
        END IF;
    END IF;
    
    -- Validate that templates have proper repeat configuration
    IF NEW.is_template = true AND NEW.is_repeating = true THEN
        IF NEW.repeat_days IS NULL OR array_length(NEW.repeat_days, 1) = 0 THEN
            RAISE EXCEPTION 'Template tasks must have at least one repeat day configured';
        END IF;
    END IF;
    
    -- Prevent improper changes to template/instance relationships during updates
    IF TG_OP = 'UPDATE' THEN
        -- If it was a template, it should remain a template (can't convert templates to instances)
        IF OLD.is_template = true AND NEW.is_template = false THEN
            RAISE EXCEPTION 'Cannot convert a template task to a regular task or instance';
        END IF;
        
        -- If it was an instance, template_id shouldn't change
        IF OLD.template_id IS NOT NULL AND NEW.template_id != OLD.template_id THEN
            RAISE EXCEPTION 'Cannot change the template_id of an existing task instance';
        END IF;
        
        -- If it was a regular task, prevent conversion to template instance
        IF OLD.is_template = false AND OLD.template_id IS NULL AND NEW.template_id IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot convert a regular task to a template instance';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for template validation
DROP TRIGGER IF EXISTS validate_task_template_relationship ON public.tasks;
CREATE TRIGGER validate_task_template_relationship
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_task_template_relationship();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create helper function for policy testing (optional)
CREATE OR REPLACE FUNCTION public.test_task_policies(test_user_id UUID)
RETURNS TABLE (
    policy_name TEXT,
    test_result BOOLEAN,
    error_message TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be used to test RLS policies in development
    -- Implementation would include various policy test scenarios
    RETURN QUERY SELECT 
        'placeholder_test'::TEXT,
        true::BOOLEAN,
        'Policy testing function placeholder'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Verify policies are created correctly
DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'tasks' AND schemaname = 'public';
    
    -- Count security functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname LIKE '%task%';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' 
    AND event_object_table = 'tasks';
    
    IF policy_count < 5 THEN
        RAISE EXCEPTION 'Expected at least 5 RLS policies, but found %', policy_count;
    END IF;
    
    RAISE NOTICE '✅ Successfully created task security system:';
    RAISE NOTICE '   - % RLS policies for comprehensive task access control', policy_count;
    RAISE NOTICE '   - % security functions for validation', function_count;
    RAISE NOTICE '   - % triggers for data integrity', trigger_count;
    RAISE NOTICE '   - Template/instance relationship validation';
    RAISE NOTICE '   - Multi-user task isolation';
    RAISE NOTICE '   - Anonymous access prevention';
    
END
$$;

-- Performance note: RLS policies are automatically indexed by PostgreSQL
-- but ensure your queries use user_id filters to leverage the policies efficiently

COMMIT;

-- Notes for manual policy removal (if needed):
-- DROP POLICY "Users can view their tasks" ON public.tasks;
-- DROP POLICY "Users can create their tasks" ON public.tasks;
-- DROP POLICY "Users can update their tasks" ON public.tasks;
-- DROP POLICY "Users can delete their tasks" ON public.tasks;
-- DROP POLICY "Users can manage task templates" ON public.tasks;
-- DROP POLICY "Deny anonymous access to tasks" ON public.tasks;
-- DROP FUNCTION IF EXISTS public.validate_task_template_relationship() CASCADE;
-- DROP FUNCTION IF EXISTS public.test_task_policies(UUID) CASCADE;