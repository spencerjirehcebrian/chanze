-- =====================================================
-- Cleanup Script - Drop All Todo Application Tables
-- Description: Completely removes all database objects created by migrations
-- WARNING: This will permanently delete all todo data!
-- =====================================================

-- Safety check - uncomment the line below to enable this destructive script
-- DO $$ BEGIN RAISE NOTICE 'DESTRUCTIVE OPERATION: Dropping all todo application data'; END $$;

BEGIN;

-- Show what will be deleted before proceeding
DO $$
DECLARE
    todo_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO todo_count FROM public.todos;
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM public.todos;
    
    RAISE NOTICE '=== DATA TO BE DELETED ===';
    RAISE NOTICE 'Total todos: %', todo_count;
    RAISE NOTICE 'Users with todos: %', user_count;
    RAISE NOTICE 'Proceeding with cleanup in 5 seconds...';
    
    -- Optional: Add a delay to give time to cancel if run by mistake
    -- PERFORM pg_sleep(5);
END
$$;

-- Drop all indexes (in reverse order of creation)
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_updated_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_task_text;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_complete_inserted;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_is_complete;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_inserted_at;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Deny anonymous access to todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only delete their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can only see their own todos" ON public.todos;

-- Drop triggers
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop the main table (this will cascade to any remaining dependencies)
DROP TABLE IF EXISTS public.todos CASCADE;

-- Verify cleanup
DO $$
DECLARE
    remaining_tables INTEGER;
    remaining_indexes INTEGER;
    remaining_policies INTEGER;
BEGIN
    -- Check for any remaining todos-related objects
    SELECT COUNT(*) INTO remaining_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'todos';
    
    SELECT COUNT(*) INTO remaining_indexes 
    FROM pg_indexes 
    WHERE tablename = 'todos' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO remaining_policies 
    FROM pg_policies 
    WHERE tablename = 'todos' AND schemaname = 'public';
    
    IF remaining_tables > 0 THEN
        RAISE WARNING 'Warning: % todos tables still exist', remaining_tables;
    END IF;
    
    IF remaining_indexes > 0 THEN
        RAISE WARNING 'Warning: % todos indexes still exist', remaining_indexes;
    END IF;
    
    IF remaining_policies > 0 THEN
        RAISE WARNING 'Warning: % todos policies still exist', remaining_policies;
    END IF;
    
    IF remaining_tables = 0 AND remaining_indexes = 0 AND remaining_policies = 0 THEN
        RAISE NOTICE '✅ Cleanup completed successfully - all todo application objects removed';
    ELSE
        RAISE WARNING '⚠️  Cleanup may be incomplete - check warnings above';
    END IF;
END
$$;

COMMIT;

-- =====================================================
-- Usage Instructions:
-- =====================================================
--
-- 1. BACKUP YOUR DATA FIRST if you want to keep it!
--    pg_dump -h your-host -U postgres -d your-database > backup.sql
--
-- 2. Uncomment the safety check line at the top of this file
--
-- 3. Run this script:
--    psql -h your-host -U postgres -d your-database -f sql/drop_tables.sql
--
-- 4. To recreate everything, run the migrations again:
--    psql -h your-host -U postgres -d your-database -f sql/migrations/001_create_todos_table.sql
--    psql -h your-host -U postgres -d your-database -f sql/migrations/002_setup_rls_policies.sql
--    psql -h your-host -U postgres -d your-database -f sql/migrations/003_create_indexes.sql
--
-- =====================================================

-- Emergency recovery (if you have a backup):
-- psql -h your-host -U postgres -d your-database < backup.sql