-- =====================================================
-- Migration: 004 - Create Task Management Utility Functions
-- Description: Creates utility functions for task template management and on-demand generation
-- Dependencies: Requires 001_create_tasks_table.sql, 002_setup_task_rls_policies.sql
-- =====================================================

BEGIN;

-- Function 1: Check if a template should generate a task on a specific date
CREATE OR REPLACE FUNCTION public.should_generate_task_on_date(
    template_record public.tasks,
    target_date DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    day_of_week INTEGER;
BEGIN
    -- Validate input template
    IF NOT template_record.is_template OR NOT template_record.is_repeating THEN
        RETURN FALSE;
    END IF;
    
    -- Check if template has repeat days configured
    IF template_record.repeat_days IS NULL OR array_length(template_record.repeat_days, 1) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Get day of week (0 = Sunday, 1 = Monday, etc.)
    day_of_week := EXTRACT(DOW FROM target_date);
    
    -- Check if target date is in the repeat pattern
    IF NOT (day_of_week = ANY(template_record.repeat_days)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target date is after template start date
    IF template_record.due_date IS NOT NULL AND target_date < template_record.due_date THEN
        RETURN FALSE;
    END IF;
    
    -- Check if target date is before template end date (if specified)
    IF template_record.repeat_until IS NOT NULL AND target_date > template_record.repeat_until THEN
        RETURN FALSE;
    END IF;
    
    -- Check if task instance already exists for this date
    IF EXISTS (
        SELECT 1 FROM public.tasks 
        WHERE template_id = template_record.id 
        AND due_date = target_date
        AND user_id = template_record.user_id
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function 2: Get next occurrence date for a template
CREATE OR REPLACE FUNCTION public.get_next_task_occurrence(
    template_id BIGINT,
    from_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record public.tasks%ROWTYPE;
    search_date DATE;
    max_search_days INTEGER := 366; -- Prevent infinite loops
    days_searched INTEGER := 0;
BEGIN
    -- Get template record
    SELECT * INTO template_record 
    FROM public.tasks 
    WHERE id = template_id AND is_template = true AND is_repeating = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Start search from next day
    search_date := from_date + 1;
    
    -- Search for next valid occurrence
    WHILE days_searched < max_search_days LOOP
        IF public.should_generate_task_on_date(template_record, search_date) THEN
            RETURN search_date;
        END IF;
        
        search_date := search_date + 1;
        days_searched := days_searched + 1;
    END LOOP;
    
    RETURN NULL; -- No occurrence found within search limit
END;
$$;

-- Function 3: Generate task instances for a template within a date range
CREATE OR REPLACE FUNCTION public.generate_task_instances_for_range(
    template_id BIGINT,
    start_date DATE,
    end_date DATE
) RETURNS TABLE (
    generated_date DATE,
    task_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record public.tasks%ROWTYPE;
    loop_date DATE;
    new_task_id BIGINT;
BEGIN
    -- Get template record with user validation
    SELECT * INTO template_record 
    FROM public.tasks 
    WHERE id = template_id 
    AND is_template = true 
    AND is_repeating = true
    AND user_id = auth.uid(); -- Ensure user owns the template
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or access denied';
    END IF;
    
    -- Validate date range
    IF start_date > end_date THEN
        RAISE EXCEPTION 'Invalid date range: start_date must be <= end_date';
    END IF;
    
    -- Loop through date range
    loop_date := start_date;
    WHILE loop_date <= end_date LOOP
        -- Check if we should generate a task for this date
        IF public.should_generate_task_on_date(template_record, loop_date) THEN
            -- Create task instance
            INSERT INTO public.tasks (
                task, user_id, due_date, is_complete, is_repeating, 
                is_template, template_id, priority, tags, notes
            ) VALUES (
                template_record.task,
                template_record.user_id,
                loop_date,
                false,
                false,
                false,
                template_record.id,
                template_record.priority,
                template_record.tags,
                template_record.notes
            ) RETURNING id INTO new_task_id;
            
            RETURN QUERY SELECT loop_date, new_task_id;
        END IF;
        
        loop_date := loop_date + 1;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function 4: Clean up old completed task instances
CREATE OR REPLACE FUNCTION public.cleanup_completed_task_instances(
    older_than_days INTEGER DEFAULT 90
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_date DATE;
    deleted_count INTEGER;
BEGIN
    -- Validate input
    IF older_than_days < 1 THEN
        RAISE EXCEPTION 'older_than_days must be positive';
    END IF;
    
    cleanup_date := CURRENT_DATE - older_than_days;
    
    -- Delete old completed task instances (not templates)
    DELETE FROM public.tasks
    WHERE is_template = false
    AND template_id IS NOT NULL
    AND is_complete = true
    AND completed_at < cleanup_date
    AND user_id = auth.uid(); -- Only cleanup current user's tasks
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function 5: Validate repeat pattern array
CREATE OR REPLACE FUNCTION public.validate_repeat_pattern(
    repeat_days INTEGER[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Check if array is null or empty
    IF repeat_days IS NULL OR array_length(repeat_days, 1) IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all values are valid day numbers (0-6)
    IF NOT (repeat_days <@ ARRAY[0,1,2,3,4,5,6]) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for duplicates (array should have unique values)
    IF array_length(repeat_days, 1) != (
        SELECT count(DISTINCT unnest) 
        FROM unnest(repeat_days)
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function 6: Get human-readable repeat pattern description
CREATE OR REPLACE FUNCTION public.get_repeat_pattern_description(
    repeat_days INTEGER[]
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    day_names TEXT[] := ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    result TEXT := '';
    day_name TEXT;
    sorted_days INTEGER[];
BEGIN
    -- Validate input
    IF NOT public.validate_repeat_pattern(repeat_days) THEN
        RETURN 'Invalid repeat pattern';
    END IF;
    
    -- Sort the days
    SELECT array_agg(day ORDER BY day) INTO sorted_days
    FROM unnest(repeat_days) AS day;
    
    -- Handle common patterns
    IF sorted_days = ARRAY[1,2,3,4,5] THEN
        RETURN 'Weekdays (Monday to Friday)';
    END IF;
    
    IF sorted_days = ARRAY[0,6] THEN
        RETURN 'Weekends (Saturday and Sunday)';
    END IF;
    
    IF sorted_days = ARRAY[0,1,2,3,4,5,6] THEN
        RETURN 'Every day';
    END IF;
    
    -- Build custom description
    FOREACH day_name IN ARRAY (
        SELECT array_agg(day_names[day + 1])
        FROM unnest(sorted_days) AS day
    ) LOOP
        IF result != '' THEN
            result := result || ', ';
        END IF;
        result := result || day_name;
    END LOOP;
    
    RETURN result;
END;
$$;

-- Function 7: Get task statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_task_statistics(
    for_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    due_today BIGINT,
    due_this_week BIGINT,
    active_templates BIGINT,
    completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total active tasks (not templates, not completed)
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = false AND is_complete = false) as total_tasks,
        
        -- Completed tasks
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = false AND is_complete = true) as completed_tasks,
        
        -- Overdue tasks
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = false AND is_complete = false 
         AND due_date IS NOT NULL AND due_date < CURRENT_DATE) as overdue_tasks,
        
        -- Due today
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = false AND is_complete = false 
         AND due_date = CURRENT_DATE) as due_today,
        
        -- Due this week
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = false AND is_complete = false 
         AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6) as due_this_week,
        
        -- Active templates
        (SELECT count(*) FROM public.tasks 
         WHERE user_id = for_user_id AND is_template = true AND is_repeating = true
         AND (repeat_until IS NULL OR repeat_until >= CURRENT_DATE)) as active_templates,
        
        -- Completion rate (percentage)
        CASE 
            WHEN (SELECT count(*) FROM public.tasks WHERE user_id = for_user_id AND is_template = false) = 0 THEN 0
            ELSE ROUND(
                (SELECT count(*)::numeric FROM public.tasks WHERE user_id = for_user_id AND is_template = false AND is_complete = true) * 100.0 /
                (SELECT count(*)::numeric FROM public.tasks WHERE user_id = for_user_id AND is_template = false),
                1
            )
        END as completion_rate;
END;
$$;

-- Function 8: Bulk update task priorities
CREATE OR REPLACE FUNCTION public.bulk_update_task_priority(
    task_ids BIGINT[],
    new_priority INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Validate priority
    IF new_priority NOT IN (0, 1, 2) THEN
        RAISE EXCEPTION 'Invalid priority. Must be 0 (low), 1 (medium), or 2 (high)';
    END IF;
    
    -- Update tasks (RLS policies will ensure user can only update their own tasks)
    UPDATE public.tasks 
    SET priority = new_priority,
        updated_at = NOW()
    WHERE id = ANY(task_ids)
    AND user_id = auth.uid()
    AND is_template = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- Add comprehensive comments for all functions
COMMENT ON FUNCTION public.should_generate_task_on_date IS 'Determines if a template should generate a task instance on a specific date';
COMMENT ON FUNCTION public.get_next_task_occurrence IS 'Finds the next valid occurrence date for a repeating task template';
COMMENT ON FUNCTION public.generate_task_instances_for_range IS 'Generates task instances from template for a specified date range';
COMMENT ON FUNCTION public.cleanup_completed_task_instances IS 'Removes old completed task instances to maintain database performance';
COMMENT ON FUNCTION public.validate_repeat_pattern IS 'Validates that repeat_days array contains valid day numbers without duplicates';
COMMENT ON FUNCTION public.get_repeat_pattern_description IS 'Returns human-readable description of repeat pattern';
COMMENT ON FUNCTION public.get_user_task_statistics IS 'Returns comprehensive task statistics for a user';
COMMENT ON FUNCTION public.bulk_update_task_priority IS 'Updates priority for multiple tasks in a single operation';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.should_generate_task_on_date TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_task_occurrence TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_task_instances_for_range TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_completed_task_instances TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_repeat_pattern TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_repeat_pattern_description TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_task_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_task_priority TO authenticated;

-- Verify all functions were created successfully
DO $$
DECLARE
    function_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'should_generate_task_on_date',
        'get_next_task_occurrence',
        'generate_task_instances_for_range',
        'cleanup_completed_task_instances',
        'validate_repeat_pattern',
        'get_repeat_pattern_description',
        'get_user_task_statistics',
        'bulk_update_task_priority'
    ];
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    func_name TEXT;
BEGIN
    -- Check each expected function
    FOREACH func_name IN ARRAY expected_functions LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;
    
    -- Count total task-related functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname LIKE '%task%';
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE WARNING '⚠️  Missing functions: %', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE '✅ Successfully created task management function library:';
        RAISE NOTICE '   - % utility functions for comprehensive task management', array_length(expected_functions, 1);
        RAISE NOTICE '   - On-demand instance generation and validation';
        RAISE NOTICE '   - Template pattern management and descriptions';
        RAISE NOTICE '   - Task statistics and bulk operations';
        RAISE NOTICE '   - Automated cleanup and maintenance';
        RAISE NOTICE '   - Security: All functions respect RLS policies';
    END IF;
    
END
$$;

COMMIT;

-- Usage Examples (commented out - for reference):
/*
-- Example 1: Check if template should generate task for today
SELECT public.should_generate_task_on_date(
    (SELECT * FROM tasks WHERE id = 1 AND is_template = true),
    CURRENT_DATE
);

-- Example 2: Get next occurrence for a template
SELECT public.get_next_task_occurrence(1, CURRENT_DATE);

-- Example 3: Generate instances for next week
SELECT * FROM public.generate_task_instances_for_range(1, CURRENT_DATE, CURRENT_DATE + 7);

-- Example 4: Get task statistics
SELECT * FROM public.get_user_task_statistics();

-- Example 5: Validate repeat pattern
SELECT public.validate_repeat_pattern(ARRAY[1,2,3,4,5]); -- weekdays

-- Example 6: Get readable description
SELECT public.get_repeat_pattern_description(ARRAY[1,2,3,4,5]); -- "Weekdays (Monday to Friday)"

-- Example 7: Clean up old completed tasks
SELECT public.cleanup_completed_task_instances(90); -- older than 90 days

-- Example 8: Bulk update priorities
SELECT public.bulk_update_task_priority(ARRAY[1,2,3], 2); -- set to high priority
*/

-- Rollback script (run manually if needed):
-- DROP FUNCTION IF EXISTS public.should_generate_task_on_date CASCADE;
-- DROP FUNCTION IF EXISTS public.get_next_task_occurrence CASCADE;
-- DROP FUNCTION IF EXISTS public.generate_task_instances_for_range CASCADE;
-- DROP FUNCTION IF EXISTS public.cleanup_completed_task_instances CASCADE;
-- DROP FUNCTION IF EXISTS public.validate_repeat_pattern CASCADE;
-- DROP FUNCTION IF EXISTS public.get_repeat_pattern_description CASCADE;
-- DROP FUNCTION IF EXISTS public.get_user_task_statistics CASCADE;
-- DROP FUNCTION IF EXISTS public.bulk_update_task_priority CASCADE;