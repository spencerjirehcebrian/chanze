-- =====================================================
-- Seed Data for Development/Testing
-- Description: Creates sample data for testing the todo application
-- Dependencies: Requires all migrations (001, 002, 003) to be run first
-- WARNING: This creates test users and data - DO NOT run in production!
-- =====================================================

-- This script should only be run in development/testing environments
-- Uncomment the line below to enable (safety check)
-- DO $$ BEGIN RAISE NOTICE 'Loading seed data for development environment'; END $$;

BEGIN;

-- Insert test users (these will be created in auth.users by Supabase Auth)
-- Note: In a real application, users are created via Supabase Auth signup
-- This is just for reference - you cannot directly insert into auth.users

-- Example of how todo data would look with real user IDs
-- Replace these UUIDs with actual user IDs from your Supabase Auth users

DO $$
DECLARE
    test_user_id_1 UUID := '11111111-1111-1111-1111-111111111111'; -- Replace with real user ID
    test_user_id_2 UUID := '22222222-2222-2222-2222-222222222222'; -- Replace with real user ID
BEGIN
    -- Insert sample todos for test user 1
    INSERT INTO public.todos (task, is_complete, user_id, inserted_at) VALUES
    ('Complete project documentation', false, test_user_id_1, NOW() - INTERVAL '2 days'),
    ('Review pull requests', true, test_user_id_1, NOW() - INTERVAL '1 day'),
    ('Set up CI/CD pipeline', false, test_user_id_1, NOW() - INTERVAL '3 hours'),
    ('Write unit tests', false, test_user_id_1, NOW() - INTERVAL '1 hour'),
    ('Deploy to staging', true, test_user_id_1, NOW() - INTERVAL '30 minutes');

    -- Insert sample todos for test user 2  
    INSERT INTO public.todos (task, is_complete, user_id, inserted_at) VALUES
    ('Learn React hooks', true, test_user_id_2, NOW() - INTERVAL '5 days'),
    ('Build todo application', false, test_user_id_2, NOW() - INTERVAL '4 days'),
    ('Set up Supabase database', true, test_user_id_2, NOW() - INTERVAL '3 days'),
    ('Implement authentication', false, test_user_id_2, NOW() - INTERVAL '2 days'),
    ('Add responsive design', false, test_user_id_2, NOW() - INTERVAL '1 day'),
    ('Write API documentation', false, test_user_id_2, NOW() - INTERVAL '2 hours');

    RAISE NOTICE 'Inserted sample todos for 2 test users';
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Skipping seed data - test user IDs do not exist in auth.users';
        RAISE NOTICE 'Create real users via Supabase Auth first, then update the UUIDs in this script';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error inserting seed data: %', SQLERRM;
END
$$;

-- Display data summary
DO $$
DECLARE
    total_todos INTEGER;
    complete_todos INTEGER;
    users_with_todos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_todos FROM public.todos;
    SELECT COUNT(*) INTO complete_todos FROM public.todos WHERE is_complete = true;
    SELECT COUNT(DISTINCT user_id) INTO users_with_todos FROM public.todos;
    
    RAISE NOTICE '=== Seed Data Summary ===';
    RAISE NOTICE 'Total todos: %', total_todos;
    RAISE NOTICE 'Completed todos: %', complete_todos;
    RAISE NOTICE 'Users with todos: %', users_with_todos;
END
$$;

COMMIT;

-- =====================================================
-- How to use this seed data:
-- =====================================================
-- 
-- 1. First, create real users in your Supabase Auth:
--    - Go to Authentication > Users in your Supabase dashboard
--    - Create test users manually, or
--    - Sign up test users through your application
--
-- 2. Copy the user IDs from Supabase dashboard:
--    - Authentication > Users > copy the UUID
--
-- 3. Replace the test_user_id_1 and test_user_id_2 UUIDs above
--
-- 4. Run this script: \i sql/seed_data.sql
--
-- =====================================================

-- Clean up seed data (run manually if needed):
/*
DELETE FROM public.todos 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);
*/