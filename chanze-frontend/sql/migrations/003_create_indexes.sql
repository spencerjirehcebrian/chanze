-- =====================================================
-- Migration: 003 - Create Performance Indexes
-- Description: Creates indexes to optimize common query patterns
-- Dependencies: Requires 001_create_todos_table.sql
-- NOTE: CONCURRENTLY indexes cannot run in transaction blocks
-- =====================================================

-- Index 1: Composite index for user_id + inserted_at (covers most common query pattern)
-- This optimizes: SELECT * FROM todos WHERE user_id = ? ORDER BY inserted_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_user_id_inserted_at 
ON public.todos (user_id, inserted_at);

-- Index 2: Composite index for user_id + is_complete (for filtering by completion status)
-- This optimizes: SELECT * FROM todos WHERE user_id = ? AND is_complete = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_user_id_is_complete 
ON public.todos (user_id, is_complete);

-- Index 3: Composite index for user_id + is_complete + inserted_at (for complex queries)
-- This optimizes: SELECT * FROM todos WHERE user_id = ? AND is_complete = ? ORDER BY inserted_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_user_id_complete_inserted 
ON public.todos (user_id, is_complete, inserted_at);

-- Index 4: Text search index for task content (for future search functionality)
-- This optimizes: SELECT * FROM todos WHERE user_id = ? AND task ILIKE '%search%'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_user_task_text 
ON public.todos (user_id, task);

-- Index 5: Updated_at index for audit/sync purposes
-- This optimizes queries that need to find recently modified todos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_updated_at 
ON public.todos (updated_at);

-- Add comments for documentation (run in transaction block)
BEGIN;
COMMENT ON INDEX idx_todos_user_id_inserted_at IS 'Optimizes user todos ordered by creation time';
COMMENT ON INDEX idx_todos_user_id_is_complete IS 'Optimizes filtering todos by completion status';
COMMENT ON INDEX idx_todos_user_id_complete_inserted IS 'Optimizes complex filtering and sorting queries';
COMMENT ON INDEX idx_todos_user_task_text IS 'Optimizes text search within user todos';
COMMENT ON INDEX idx_todos_updated_at IS 'Optimizes audit and sync queries by modification time';

-- Verify indexes were created
DO $$
DECLARE
    index_count INTEGER;
    expected_indexes TEXT[] := ARRAY[
        'idx_todos_user_id_inserted_at',
        'idx_todos_user_id_is_complete', 
        'idx_todos_user_id_complete_inserted',
        'idx_todos_user_task_text',
        'idx_todos_updated_at'
    ];
    missing_indexes TEXT[];
    idx_name TEXT;
BEGIN
    -- Check each expected index
    FOREACH idx_name IN ARRAY expected_indexes LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'todos' 
            AND schemaname = 'public' 
            AND indexname = idx_name
        ) THEN
            missing_indexes := array_append(missing_indexes, idx_name);
        END IF;
    END LOOP;
    
    -- Count total indexes on todos table
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'todos' AND schemaname = 'public';
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING 'Missing indexes: %', array_to_string(missing_indexes, ', ');
    END IF;
    
    RAISE NOTICE 'Created % total indexes on todos table', index_count;
END
$$;

-- Performance optimization notes:
-- 1. CONCURRENTLY creates indexes without blocking table operations
-- 2. Composite indexes are ordered by selectivity (most selective first)
-- 3. All indexes include user_id since RLS policies always filter by it
-- 4. Text index supports partial string matching for future search features

COMMIT;

-- Performance optimization notes:
-- 1. CONCURRENTLY creates indexes without blocking table operations
-- 2. Composite indexes are ordered by selectivity (most selective first)
-- 3. All indexes include user_id since RLS policies always filter by it
-- 4. Text index supports partial string matching for future search features

-- Manual cleanup script (if indexes need to be rebuilt):
/*
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_inserted_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_is_complete;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_id_complete_inserted;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_user_task_text;
DROP INDEX CONCURRENTLY IF EXISTS idx_todos_updated_at;
*/