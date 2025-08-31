-- =====================================================
-- Migration: 001 - Create todos table
-- Description: Creates the main todos table with proper constraints
-- Dependencies: Requires Supabase auth.users table (built-in)
-- =====================================================

BEGIN;

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id BIGSERIAL PRIMARY KEY,
    task TEXT NOT NULL CHECK (length(task) > 0 AND length(task) <= 1000),
    is_complete BOOLEAN NOT NULL DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.todos IS 'User todo items with authentication integration';
COMMENT ON COLUMN public.todos.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN public.todos.task IS 'Todo task description (1-1000 characters)';
COMMENT ON COLUMN public.todos.is_complete IS 'Completion status of the todo';
COMMENT ON COLUMN public.todos.user_id IS 'Reference to auth.users.id for user isolation';
COMMENT ON COLUMN public.todos.inserted_at IS 'When the todo was created';
COMMENT ON COLUMN public.todos.updated_at IS 'When the todo was last modified';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger to automatically update updated_at on UPDATE
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.todos TO authenticated;
GRANT ALL ON SEQUENCE public.todos_id_seq TO authenticated;

-- Verify table creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todos') THEN
        RAISE EXCEPTION 'Failed to create todos table';
    END IF;
    
    RAISE NOTICE 'Successfully created todos table with % columns', 
        (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'todos');
END
$$;

COMMIT;

-- Rollback script (run manually if needed):
-- DROP TABLE IF EXISTS public.todos CASCADE;
-- DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;