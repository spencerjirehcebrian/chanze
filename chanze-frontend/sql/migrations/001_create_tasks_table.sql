-- =====================================================
-- Migration: 001 - Create tasks table
-- Description: Creates the comprehensive tasks table with scheduling, repeating, and enhanced features
-- Dependencies: Requires Supabase auth.users table (built-in)
-- =====================================================

BEGIN;

-- Create comprehensive tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    -- Core fields
    id BIGSERIAL PRIMARY KEY,
    task TEXT NOT NULL CHECK (length(task) > 0 AND length(task) <= 1000),
    is_complete BOOLEAN NOT NULL DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Scheduling fields
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Repeating task fields
    is_repeating BOOLEAN NOT NULL DEFAULT FALSE,
    repeat_days INTEGER[] CHECK (
        array_length(repeat_days, 1) IS NULL OR 
        (array_length(repeat_days, 1) > 0 AND repeat_days <@ ARRAY[0,1,2,3,4,5,6])
    ),
    repeat_until DATE,
    template_id BIGINT REFERENCES public.tasks(id) ON DELETE CASCADE,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Enhanced task management
    priority INTEGER NOT NULL DEFAULT 0 CHECK (priority IN (0, 1, 2)),
    tags TEXT[],
    notes TEXT CHECK (length(notes) <= 5000),
    
    -- Business logic constraints
    CONSTRAINT chk_template_not_self_reference 
        CHECK (NOT (is_template = true AND template_id IS NOT NULL)),
    CONSTRAINT chk_repeating_has_template 
        CHECK (NOT (is_repeating = true AND is_template = false AND template_id IS NULL)),
    CONSTRAINT chk_completed_at_when_complete 
        CHECK (NOT (is_complete = true AND completed_at IS NULL)),
    CONSTRAINT chk_repeat_until_after_due_date 
        CHECK (repeat_until IS NULL OR due_date IS NULL OR repeat_until >= due_date),
    CONSTRAINT chk_template_has_repeat_config 
        CHECK (NOT (is_template = true AND is_repeating = true AND repeat_days IS NULL))
);

-- Add comprehensive comments for documentation
COMMENT ON TABLE public.tasks IS 'Comprehensive task management with scheduling, repeating patterns, and enhanced features';
COMMENT ON COLUMN public.tasks.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN public.tasks.task IS 'Task description (1-1000 characters)';
COMMENT ON COLUMN public.tasks.is_complete IS 'Completion status of the task';
COMMENT ON COLUMN public.tasks.user_id IS 'Reference to auth.users.id for user isolation';
COMMENT ON COLUMN public.tasks.inserted_at IS 'When the task was created';
COMMENT ON COLUMN public.tasks.updated_at IS 'When the task was last modified';
COMMENT ON COLUMN public.tasks.due_date IS 'When the task is due (optional)';
COMMENT ON COLUMN public.tasks.completed_at IS 'When the task was completed (set automatically)';
COMMENT ON COLUMN public.tasks.is_repeating IS 'Whether this task has a repeating pattern';
COMMENT ON COLUMN public.tasks.repeat_days IS 'Array of days (0=Sunday, 1=Monday, etc.) for repeating tasks';
COMMENT ON COLUMN public.tasks.repeat_until IS 'End date for repeating pattern (optional)';
COMMENT ON COLUMN public.tasks.template_id IS 'Reference to template task for generated instances';
COMMENT ON COLUMN public.tasks.is_template IS 'Whether this is a template for generating task instances';
COMMENT ON COLUMN public.tasks.priority IS 'Priority level: 0=low, 1=medium, 2=high';
COMMENT ON COLUMN public.tasks.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN public.tasks.notes IS 'Additional notes and details (max 5000 characters)';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically set completed_at when task is completed
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If task is being marked as complete and completed_at is not set
    IF NEW.is_complete = true AND OLD.is_complete = false AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- If task is being marked as incomplete, clear completed_at
    IF NEW.is_complete = false AND OLD.is_complete = true THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_tasks_completed_at ON public.tasks;
CREATE TRIGGER set_tasks_completed_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_completed_at();

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON SEQUENCE public.tasks_id_seq TO authenticated;

-- Create enum types for better type safety (optional but recommended)
DO $$
BEGIN
    -- Create priority enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
        COMMENT ON TYPE task_priority IS 'Priority levels for tasks';
    END IF;
END
$$;

-- Verify table creation and constraints
DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        RAISE EXCEPTION 'Failed to create tasks table';
    END IF;
    
    -- Count columns
    SELECT count(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tasks';
    
    -- Count constraints
    SELECT count(*) INTO constraint_count 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'tasks';
    
    -- Count triggers
    SELECT count(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' AND event_object_table = 'tasks';
    
    RAISE NOTICE '✅ Successfully created tasks table with:';
    RAISE NOTICE '   - % columns', column_count;
    RAISE NOTICE '   - % constraints', constraint_count;
    RAISE NOTICE '   - % triggers', trigger_count;
    RAISE NOTICE '   - Row Level Security enabled';
    
    -- Verify specific constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_template_not_self_reference') THEN
        RAISE WARNING '⚠️  Template self-reference constraint not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_repeating_has_template') THEN
        RAISE WARNING '⚠️  Repeating task template constraint not found';
    END IF;
    
END
$$;

COMMIT;

-- Rollback script (run manually if needed):
-- DROP TABLE IF EXISTS public.tasks CASCADE;
-- DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS public.set_completed_at() CASCADE;
-- DROP TYPE IF EXISTS task_priority CASCADE;