-- =====================================================
-- Migration: 003 - Create Performance Indexes for Tasks
-- Description: Creates comprehensive indexes optimized for task management system
-- Dependencies: Requires 001_create_tasks_table.sql
-- NOTE: CONCURRENTLY indexes cannot run in transaction blocks
-- =====================================================

-- Core Performance Indexes

-- Index 1: Primary user task listing (most common query)
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND is_template = false ORDER BY inserted_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_id_inserted_at 
ON public.tasks (user_id, inserted_at) 
WHERE is_template = false;

-- Index 2: Task completion filtering
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND is_complete = ? AND is_template = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_id_is_complete 
ON public.tasks (user_id, is_complete) 
WHERE is_template = false;

-- Index 3: Due date scheduling queries
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND due_date BETWEEN ? AND ? AND is_template = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_due_date 
ON public.tasks (user_id, due_date) 
WHERE is_template = false AND due_date IS NOT NULL;

-- Index 4: Priority-based task filtering
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND priority = ? AND is_template = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_priority 
ON public.tasks (user_id, priority) 
WHERE is_template = false;

-- Template and Instance Indexes

-- Index 5: Template management
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND is_template = true
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_templates 
ON public.tasks (user_id, is_template) 
WHERE is_template = true;

-- Index 6: Task instance relationships
-- Optimizes: SELECT * FROM tasks WHERE template_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_template_id 
ON public.tasks (template_id) 
WHERE template_id IS NOT NULL;

-- Index 7: Active repeating templates
-- Optimizes finding templates for on-demand generation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_repeating_active 
ON public.tasks (user_id, is_repeating, repeat_until) 
WHERE is_template = true AND is_repeating = true;

-- Advanced Query Optimization Indexes

-- Index 8: Overdue tasks detection
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND due_date < CURRENT_DATE AND is_complete = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_overdue 
ON public.tasks (user_id, due_date) 
WHERE is_complete = false AND due_date IS NOT NULL AND is_template = false;

-- Index 9: Tag-based filtering (GIN index for arrays)
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND tags && ARRAY['tag1', 'tag2']
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tags 
ON public.tasks USING GIN (tags) 
WHERE tags IS NOT NULL;

-- Index 10: Full-text search across task content and notes
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND search_vector @@ plainto_tsquery('search term')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_text_search 
ON public.tasks USING GIN (
    to_tsvector('english', task || ' ' || COALESCE(notes, ''))
) 
WHERE is_template = false;

-- Index 11: Recently updated tasks (for sync/audit)
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND updated_at > ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_updated_at 
ON public.tasks (user_id, updated_at);

-- Index 12: Complex scheduling queries (due date + priority + completion)
-- Optimizes dashboard queries with multiple filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_scheduling_complex 
ON public.tasks (user_id, due_date, priority, is_complete) 
WHERE is_template = false AND due_date IS NOT NULL;

-- Calendar View Optimization Index

-- Index 13: Calendar date range queries
-- Optimizes: SELECT * FROM tasks WHERE user_id = ? AND due_date BETWEEN ? AND ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_calendar_range 
ON public.tasks (user_id, due_date, is_complete, priority) 
WHERE is_template = false AND due_date IS NOT NULL;

-- Add comprehensive comments for documentation
BEGIN;

-- Comments on core indexes
COMMENT ON INDEX idx_tasks_user_id_inserted_at IS 'Optimizes main task listing queries ordered by creation time';
COMMENT ON INDEX idx_tasks_user_id_is_complete IS 'Optimizes filtering tasks by completion status';
COMMENT ON INDEX idx_tasks_user_due_date IS 'Optimizes due date scheduling and calendar queries';
COMMENT ON INDEX idx_tasks_user_priority IS 'Optimizes priority-based task filtering and sorting';

-- Comments on template indexes
COMMENT ON INDEX idx_tasks_user_templates IS 'Optimizes template management queries';
COMMENT ON INDEX idx_tasks_template_id IS 'Optimizes task instance relationship queries';
COMMENT ON INDEX idx_tasks_repeating_active IS 'Optimizes finding active templates for on-demand generation';

-- Comments on advanced indexes
COMMENT ON INDEX idx_tasks_overdue IS 'Optimizes overdue task detection queries';
COMMENT ON INDEX idx_tasks_tags IS 'Optimizes tag-based filtering using GIN array operations';
COMMENT ON INDEX idx_tasks_text_search IS 'Optimizes full-text search across task content and notes';
COMMENT ON INDEX idx_tasks_updated_at IS 'Optimizes audit queries and data synchronization';
COMMENT ON INDEX idx_tasks_scheduling_complex IS 'Optimizes complex dashboard queries with multiple filters';
COMMENT ON INDEX idx_tasks_calendar_range IS 'Optimizes calendar view date range queries';

-- Verify all indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
    expected_indexes TEXT[] := ARRAY[
        'idx_tasks_user_id_inserted_at',
        'idx_tasks_user_id_is_complete',
        'idx_tasks_user_due_date',
        'idx_tasks_user_priority',
        'idx_tasks_user_templates',
        'idx_tasks_template_id',
        'idx_tasks_repeating_active',
        'idx_tasks_overdue',
        'idx_tasks_tags',
        'idx_tasks_text_search',
        'idx_tasks_updated_at',
        'idx_tasks_scheduling_complex',
        'idx_tasks_calendar_range'
    ];
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
    idx_name TEXT;
    gin_indexes INTEGER;
    partial_indexes INTEGER;
BEGIN
    -- Check each expected index
    FOREACH idx_name IN ARRAY expected_indexes LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'tasks' 
            AND schemaname = 'public' 
            AND indexname = idx_name
        ) THEN
            missing_indexes := array_append(missing_indexes, idx_name);
        END IF;
    END LOOP;
    
    -- Count total indexes on tasks table
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'tasks' AND schemaname = 'public';
    
    -- Count special index types
    SELECT COUNT(*) INTO gin_indexes
    FROM pg_indexes 
    WHERE tablename = 'tasks' AND schemaname = 'public'
    AND indexdef LIKE '%USING gin%';
    
    SELECT COUNT(*) INTO partial_indexes
    FROM pg_indexes 
    WHERE tablename = 'tasks' AND schemaname = 'public'
    AND indexdef LIKE '%WHERE%';
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING '⚠️  Missing indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE '✅ Successfully created comprehensive task index system:';
        RAISE NOTICE '   - % total indexes for optimal query performance', index_count;
        RAISE NOTICE '   - % GIN indexes for advanced array and text search', gin_indexes;
        RAISE NOTICE '   - % partial indexes for targeted optimization', partial_indexes;
        RAISE NOTICE '   - Supports: task listing, scheduling, templates, search, analytics';
        RAISE NOTICE '   - Optimized for: calendar views, priority filtering, tag search';
        RAISE NOTICE '   - Performance: on-demand generation, overdue detection, text search';
    END IF;
    
END
$$;

-- Performance Analysis Helper
CREATE OR REPLACE FUNCTION public.analyze_task_query_performance()
RETURNS TABLE (
    query_pattern TEXT,
    recommended_index TEXT,
    performance_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
        ('SELECT * FROM tasks WHERE user_id = ? ORDER BY inserted_at', 'idx_tasks_user_id_inserted_at', 'Primary task listing - fully optimized'),
        ('SELECT * FROM tasks WHERE user_id = ? AND due_date BETWEEN ? AND ?', 'idx_tasks_user_due_date', 'Calendar queries - fully optimized'),
        ('SELECT * FROM tasks WHERE user_id = ? AND tags && ARRAY[?]', 'idx_tasks_tags', 'Tag filtering - GIN index optimized'),
        ('SELECT * FROM tasks WHERE template_id = ?', 'idx_tasks_template_id', 'Template instance queries - optimized'),
        ('Full-text search queries', 'idx_tasks_text_search', 'Text search - GIN tsvector optimized'),
        ('Overdue task detection', 'idx_tasks_overdue', 'Partial index for incomplete + overdue tasks');
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Performance Notes:
-- 1. CONCURRENTLY creates indexes without blocking table operations
-- 2. Partial indexes (WHERE clauses) reduce index size and improve performance
-- 3. GIN indexes enable advanced array operations and full-text search
-- 4. Composite indexes are ordered by selectivity for optimal performance
-- 5. All user-facing indexes include user_id for RLS policy optimization

-- Manual cleanup script (run manually if indexes need to be rebuilt):
/*
-- Core indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_id_inserted_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_id_is_complete;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_due_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_priority;

-- Template indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_templates;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_template_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_repeating_active;

-- Advanced indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_overdue;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tags;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_text_search;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_updated_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_scheduling_complex;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_calendar_range;

-- Helper functions
DROP FUNCTION IF EXISTS public.analyze_task_query_performance();
*/