-- =====================================================
-- Cleanup Script - Drop All Task Management System Objects
-- Description: Completely removes all database objects created by task migrations
-- WARNING: This will permanently delete all task data, templates, and instances!
-- =====================================================

-- Safety check - uncomment the line below to enable this destructive script
-- DO $$ BEGIN RAISE NOTICE 'DESTRUCTIVE OPERATION: Dropping all task management system data'; END $$;

BEGIN;

-- Show what will be deleted before proceeding
DO $$
DECLARE
    task_count INTEGER;
    template_count INTEGER;
    instance_count INTEGER;
    user_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count different types of data
    SELECT COUNT(*) INTO task_count FROM public.tasks WHERE is_template = false;
    SELECT COUNT(*) INTO template_count FROM public.tasks WHERE is_template = true;
    SELECT COUNT(*) INTO instance_count FROM public.tasks WHERE template_id IS NOT NULL;
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM public.tasks;
    
    -- Count database objects
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND (p.proname LIKE '%task%' OR p.proname LIKE '%updated_at%');
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'tasks' AND schemaname = 'public';
    
    RAISE NOTICE '=== TASK MANAGEMENT DATA TO BE DELETED ===';
    RAISE NOTICE 'Total active tasks: %', task_count;
    RAISE NOTICE 'Template tasks: %', template_count;  
    RAISE NOTICE 'Generated task instances: %', instance_count;
    RAISE NOTICE 'Users with tasks: %', user_count;
    RAISE NOTICE 'Database functions: %', function_count;
    RAISE NOTICE 'Database indexes: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE 'This will remove ALL task management system objects:';
    RAISE NOTICE '- Tasks table with all data';
    RAISE NOTICE '- Template/instance relationships';
    RAISE NOTICE '- All utility functions';
    RAISE NOTICE '- All performance indexes';
    RAISE NOTICE '- All RLS policies and triggers';
    RAISE NOTICE '';
    RAISE NOTICE 'Proceeding with cleanup...';
    
    -- Optional: Add a delay to give time to cancel if run by mistake
    -- PERFORM pg_sleep(10);
END
$$;

-- Drop all task-related indexes (in reverse order of creation from 003_create_task_indexes.sql)
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_calendar_range;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_scheduling_complex;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_updated_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_text_search;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tags;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_overdue;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_repeating_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_template_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_templates;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_priority;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_due_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_id_is_complete;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_id_inserted_at;

-- Drop all RLS policies (from 002_setup_task_rls_policies.sql)
DROP POLICY IF EXISTS "Deny anonymous access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage task templates" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;

-- Drop all triggers (from multiple migrations)
DROP TRIGGER IF EXISTS validate_task_template_relationship ON public.tasks;
DROP TRIGGER IF EXISTS set_tasks_completed_at ON public.tasks;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;

-- Drop all utility functions (from 004_create_task_functions.sql)
DROP FUNCTION IF EXISTS public.bulk_update_task_priority(BIGINT[], INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_task_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_repeat_pattern_description(INTEGER[]) CASCADE;
DROP FUNCTION IF EXISTS public.validate_repeat_pattern(INTEGER[]) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_completed_task_instances(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.generate_task_instances_for_range(BIGINT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.get_next_task_occurrence(BIGINT, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.should_generate_task_on_date(public.tasks, DATE) CASCADE;

-- Drop helper and analysis functions (from 003_create_task_indexes.sql)
DROP FUNCTION IF EXISTS public.analyze_task_query_performance() CASCADE;

-- Drop security and helper functions (from 002_setup_task_rls_policies.sql)
DROP FUNCTION IF EXISTS public.test_task_policies(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.validate_task_template_relationship() CASCADE;

-- Drop seed data helper functions (from seed_data_tasks.sql)
DROP FUNCTION IF EXISTS public.clear_sample_tasks() CASCADE;
DROP FUNCTION IF EXISTS public.generate_sample_task_instances(INTEGER, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_sample_task_user_ids(UUID) CASCADE;

-- Drop core utility functions (from 001_create_tasks_table.sql)
DROP FUNCTION IF EXISTS public.set_completed_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop custom types (from 001_create_tasks_table.sql)
DROP TYPE IF EXISTS task_priority CASCADE;

-- Drop the main tasks table (this will cascade to any remaining dependencies)
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Verify comprehensive cleanup
DO $$
DECLARE
    remaining_tables INTEGER;
    remaining_indexes INTEGER;
    remaining_policies INTEGER;
    remaining_functions INTEGER;
    remaining_types INTEGER;
    remaining_triggers INTEGER;
BEGIN
    -- Check for any remaining task-related objects
    SELECT COUNT(*) INTO remaining_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tasks';
    
    SELECT COUNT(*) INTO remaining_indexes 
    FROM pg_indexes 
    WHERE tablename = 'tasks' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO remaining_policies 
    FROM pg_policies 
    WHERE tablename = 'tasks' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO remaining_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND (p.proname LIKE '%task%' OR p.proname LIKE '%updated_at%' OR p.proname LIKE '%completed_at%');
    
    SELECT COUNT(*) INTO remaining_types
    FROM pg_type 
    WHERE typname = 'task_priority';
    
    SELECT COUNT(*) INTO remaining_triggers
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' 
    AND event_object_table = 'tasks';
    
    -- Report cleanup status
    RAISE NOTICE '=== CLEANUP VERIFICATION ===';
    
    IF remaining_tables > 0 THEN
        RAISE WARNING '⚠️  Warning: % task tables still exist', remaining_tables;
    ELSE
        RAISE NOTICE '✅ Tasks table removed successfully';
    END IF;
    
    IF remaining_indexes > 0 THEN
        RAISE WARNING '⚠️  Warning: % task indexes still exist', remaining_indexes;
    ELSE
        RAISE NOTICE '✅ All task indexes removed successfully';
    END IF;
    
    IF remaining_policies > 0 THEN
        RAISE WARNING '⚠️  Warning: % task RLS policies still exist', remaining_policies;
    ELSE
        RAISE NOTICE '✅ All RLS policies removed successfully';
    END IF;
    
    IF remaining_functions > 0 THEN
        RAISE WARNING '⚠️  Warning: % task-related functions still exist', remaining_functions;
    ELSE
        RAISE NOTICE '✅ All utility functions removed successfully';
    END IF;
    
    IF remaining_types > 0 THEN
        RAISE WARNING '⚠️  Warning: % task-related types still exist', remaining_types;
    ELSE
        RAISE NOTICE '✅ All custom types removed successfully';
    END IF;
    
    IF remaining_triggers > 0 THEN
        RAISE WARNING '⚠️  Warning: % task triggers still exist', remaining_triggers;
    ELSE
        RAISE NOTICE '✅ All triggers removed successfully';
    END IF;
    
    -- Overall status
    IF remaining_tables = 0 AND remaining_indexes = 0 AND remaining_policies = 0 
       AND remaining_functions = 0 AND remaining_types = 0 AND remaining_triggers = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 CLEANUP COMPLETED SUCCESSFULLY';
        RAISE NOTICE 'All task management system objects have been removed';
        RAISE NOTICE 'Database is ready for fresh migration installation';
    ELSE
        RAISE WARNING '';
        RAISE WARNING '⚠️  CLEANUP MAY BE INCOMPLETE';
        RAISE WARNING 'Some objects may still exist - check warnings above';
        RAISE WARNING 'You may need to manually remove remaining objects';
    END IF;
END
$$;

COMMIT;

-- =====================================================
-- Usage Instructions:
-- =====================================================
--
-- 1. BACKUP YOUR DATA FIRST if you want to keep any task data!
--    pg_dump -h your-host -U postgres -d your-database > backup_before_cleanup.sql
--
-- 2. Uncomment the safety check line at the top of this file
--
-- 3. Run this cleanup script:
--    psql -h your-host -U postgres -d your-database -f sql/drop_tables.sql
--
-- 4. To recreate the task system, run migrations in order:
--    psql -h your-host -U postgres -d your-database -f sql/migrations/001_create_tasks_table.sql
--    psql -h your-host -U postgres -d your-database -f sql/migrations/002_setup_task_rls_policies.sql
--    psql -h your-host -U postgres -d your-database -f sql/migrations/003_create_task_indexes.sql
--    psql -h your-host -U postgres -d your-database -f sql/migrations/004_create_task_functions.sql
--
-- 5. Optionally add sample data:
--    psql -h your-host -U postgres -d your-database -f sql/seed_data_tasks.sql
--
-- =====================================================

-- Manual verification queries (run these after cleanup to double-check):
/*
-- Check for any remaining task-related objects:
SELECT 'Tables:' as object_type, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%task%'
UNION ALL
SELECT 'Functions:', COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname LIKE '%task%'
UNION ALL  
SELECT 'Indexes:', COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%task%'
UNION ALL
SELECT 'Policies:', COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks';
*/

-- Emergency recovery (if you have a backup):
-- psql -h your-host -U postgres -d your-database < backup_before_cleanup.sql