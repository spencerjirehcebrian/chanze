-- =====================================================
-- Seed Data - Rich Sample Tasks for Development and Testing
-- Description: Creates comprehensive sample task data showcasing all features
-- Dependencies: Requires 001_create_tasks_table.sql through 004_create_task_functions.sql
-- =====================================================

-- Safety check - uncomment the line below to enable seeding
-- DO $$ BEGIN RAISE NOTICE 'SEEDING: Adding rich sample task data for development'; END $$;

BEGIN;

-- Create sample tasks with comprehensive features
-- Note: These use placeholder user IDs that should be replaced with actual authenticated user IDs
INSERT INTO public.tasks (
    task,
    is_complete,
    user_id,
    due_date,
    priority,
    tags,
    notes,
    is_template,
    is_repeating,
    repeat_days,
    repeat_until,
    inserted_at
) VALUES
    -- Regular tasks with various priorities and features
    ('Complete quarterly budget review', false, '00000000-0000-0000-0000-000000000000', 
     CURRENT_DATE + 3, 2, ARRAY['work', 'finance'], 
     'Review Q4 expenses and prepare budget for next quarter. Include marketing and development costs.',
     false, false, NULL, NULL, NOW() - INTERVAL '2 hours'),
    
    ('Buy ingredients for dinner party', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE + 1, 1, ARRAY['shopping', 'social'],
     'Need: salmon, asparagus, wine, dessert ingredients. Check dietary restrictions with guests.',
     false, false, NULL, NULL, NOW() - INTERVAL '3 hours'),
    
    ('Read "Design Patterns" chapter 5', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE + 7, 0, ARRAY['learning', 'programming'],
     'Focus on Factory and Abstract Factory patterns. Take notes for team presentation.',
     false, false, NULL, NULL, NOW() - INTERVAL '1 day'),
    
    ('Call insurance agent about policy renewal', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE + 2, 1, ARRAY['admin', 'personal'],
     'Policy expires next month. Compare rates with other providers.',
     false, false, NULL, NULL, NOW() - INTERVAL '5 hours'),
    
    -- Completed tasks to show history
    ('Submit project proposal', true, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE - 1, 2, ARRAY['work', 'projects'],
     'AI-powered customer support system proposal. Submitted to management for Q1 approval.',
     false, false, NULL, NULL, NOW() - INTERVAL '3 days'),
     
    ('Book flight for conference', true, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE - 5, 1, ARRAY['travel', 'work'],
     'DevCon 2024 in Austin. Booked round-trip flights and hotel reservation.',
     false, false, NULL, NULL, NOW() - INTERVAL '1 week'),

    -- Overdue tasks to test filters
    ('Update portfolio website', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE - 10, 1, ARRAY['personal', 'programming'],
     'Add latest projects and update skills section. Fix mobile responsiveness issues.',
     false, false, NULL, NULL, NOW() - INTERVAL '2 weeks'),
     
    ('Renew domain registration', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE - 3, 2, ARRAY['admin', 'website'],
     'Domain expires soon! Renew for 2 years to get discount.',
     false, false, NULL, NULL, NOW() - INTERVAL '1 month'),

    -- Tasks with no due date
    ('Organize digital photos', false, '00000000-0000-0000-0000-000000000000',
     NULL, 0, ARRAY['personal', 'organization'],
     'Sort photos from last year into albums. Delete duplicates and backup to cloud.',
     false, false, NULL, NULL, NOW() - INTERVAL '1 day'),
     
    ('Learn Spanish vocabulary', false, '00000000-0000-0000-0000-000000000000',
     NULL, 0, ARRAY['learning', 'language'],
     'Practice 20 new words daily. Use flashcards and Anki for spaced repetition.',
     false, false, NULL, NULL, NOW() - INTERVAL '6 hours');

-- Create template tasks for repeating patterns
INSERT INTO public.tasks (
    task,
    is_complete,
    user_id,
    due_date,
    priority,
    tags,
    notes,
    is_template,
    is_repeating,
    repeat_days,
    repeat_until,
    inserted_at
) VALUES
    -- Daily exercise template
    ('Morning workout - 30 minutes', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 1, ARRAY['health', 'exercise'],
     'Alternate between cardio and strength training. Track progress in fitness app.',
     true, true, ARRAY[1,2,3,4,5], CURRENT_DATE + INTERVAL '3 months', NOW() - INTERVAL '1 week'),
     
    -- Weekly team standup
    ('Weekly team standup meeting', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 2, ARRAY['work', 'meetings'],
     'Review sprint progress, discuss blockers, plan upcoming work. Prepare status update.',
     true, true, ARRAY[1], CURRENT_DATE + INTERVAL '6 months', NOW() - INTERVAL '2 weeks'),
     
    -- Weekend house cleaning
    ('Deep clean the house', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 1, ARRAY['personal', 'cleaning'],
     'Vacuum all rooms, mop floors, clean bathrooms, dust furniture. Put on energetic music!',
     true, true, ARRAY[6], NULL, NOW() - INTERVAL '3 days'),
     
    -- Weekday commute reading
    ('Read during commute', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 0, ARRAY['learning', 'reading'],
     'Current book: "Clean Architecture". Aim for 20-30 pages per day.',
     true, true, ARRAY[1,2,3,4,5], CURRENT_DATE + INTERVAL '2 months', NOW() - INTERVAL '5 days'),
     
    -- Bi-weekly client check-in
    ('Client status call with Acme Corp', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 2, ARRAY['work', 'clients'],
     'Review project milestones, address any concerns, discuss upcoming deliverables.',
     true, true, ARRAY[3], CURRENT_DATE + INTERVAL '4 months', NOW() - INTERVAL '1 week'),
     
    -- Monthly financial review
    ('Monthly budget and expense review', false, '00000000-0000-0000-0000-000000000000',
     CURRENT_DATE, 1, ARRAY['finance', 'personal'],
     'Categorize expenses, update budget spreadsheet, review investment portfolio performance.',
     true, true, ARRAY[0], NULL, NOW() - INTERVAL '10 days');

-- Generate some task instances from templates
DO $$
DECLARE
    template_record public.tasks%ROWTYPE;
    dates_to_generate DATE[] := ARRAY[
        CURRENT_DATE - 7,
        CURRENT_DATE - 6,
        CURRENT_DATE - 5,
        CURRENT_DATE - 3,
        CURRENT_DATE - 1,
        CURRENT_DATE,
        CURRENT_DATE + 1
    ];
    target_date DATE;
BEGIN
    -- Generate instances for the workout template
    SELECT * INTO template_record FROM public.tasks WHERE task LIKE 'Morning workout%' AND is_template = true;
    
    FOREACH target_date IN ARRAY dates_to_generate LOOP
        IF public.should_generate_task_on_date(template_record, target_date) THEN
            INSERT INTO public.tasks (
                task, user_id, due_date, is_complete, is_repeating, 
                is_template, template_id, priority, tags, notes
            ) VALUES (
                template_record.task,
                template_record.user_id,
                target_date,
                CASE WHEN target_date < CURRENT_DATE THEN (random() > 0.3) ELSE false END, -- Some past tasks completed
                false,
                false,
                template_record.id,
                template_record.priority,
                template_record.tags,
                template_record.notes
            );
        END IF;
    END LOOP;
    
    -- Generate instances for the reading template
    SELECT * INTO template_record FROM public.tasks WHERE task LIKE 'Read during commute%' AND is_template = true;
    
    FOREACH target_date IN ARRAY dates_to_generate LOOP
        IF public.should_generate_task_on_date(template_record, target_date) THEN
            INSERT INTO public.tasks (
                task, user_id, due_date, is_complete, is_repeating, 
                is_template, template_id, priority, tags, notes
            ) VALUES (
                template_record.task,
                template_record.user_id,
                target_date,
                CASE WHEN target_date < CURRENT_DATE THEN (random() > 0.4) ELSE false END,
                false,
                false,
                template_record.id,
                template_record.priority,
                template_record.tags,
                template_record.notes
            );
        END IF;
    END LOOP;
END
$$;

-- Display comprehensive statistics
DO $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    template_count INTEGER;
    instance_count INTEGER;
    overdue_count INTEGER;
    priority_high INTEGER;
    priority_medium INTEGER;
    priority_low INTEGER;
    tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tasks FROM public.tasks WHERE is_template = false;
    SELECT COUNT(*) INTO completed_tasks FROM public.tasks WHERE is_template = false AND is_complete = true;
    SELECT COUNT(*) INTO template_count FROM public.tasks WHERE is_template = true;
    SELECT COUNT(*) INTO instance_count FROM public.tasks WHERE is_template = false AND template_id IS NOT NULL;
    SELECT COUNT(*) INTO overdue_count FROM public.tasks WHERE is_template = false AND due_date < CURRENT_DATE AND is_complete = false;
    SELECT COUNT(*) INTO priority_high FROM public.tasks WHERE is_template = false AND priority = 2;
    SELECT COUNT(*) INTO priority_medium FROM public.tasks WHERE is_template = false AND priority = 1;
    SELECT COUNT(*) INTO priority_low FROM public.tasks WHERE is_template = false AND priority = 0;
    SELECT COUNT(DISTINCT unnest(tags)) INTO tag_count FROM public.tasks WHERE tags IS NOT NULL;
    
    RAISE NOTICE '✅ Successfully seeded comprehensive task data:';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TASK STATISTICS:';
    RAISE NOTICE '   - % total active tasks', total_tasks;
    RAISE NOTICE '   - % completed tasks (%.1f%% completion rate)', completed_tasks, 
        CASE WHEN total_tasks > 0 THEN (completed_tasks::decimal / total_tasks * 100) ELSE 0 END;
    RAISE NOTICE '   - % template tasks for repeating patterns', template_count;
    RAISE NOTICE '   - % generated task instances', instance_count;
    RAISE NOTICE '   - % overdue tasks', overdue_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRIORITY DISTRIBUTION:';
    RAISE NOTICE '   - High (2): % tasks', priority_high;
    RAISE NOTICE '   - Medium (1): % tasks', priority_medium;
    RAISE NOTICE '   - Low (0): % tasks', priority_low;
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  FEATURES DEMONSTRATED:';
    RAISE NOTICE '   - % unique tags across all tasks', tag_count;
    RAISE NOTICE '   - Due dates (scheduled, overdue, none)';
    RAISE NOTICE '   - Rich notes and descriptions';
    RAISE NOTICE '   - Template/instance relationships';
    RAISE NOTICE '   - Repeating patterns (daily, weekly, monthly)';
    RAISE NOTICE '   - Priority levels and tag categorization';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Replace placeholder user IDs with real authenticated user IDs';
    RAISE NOTICE '   Placeholder ID: 00000000-0000-0000-0000-000000000000';
END
$$;

COMMIT;

-- =====================================================
-- Development Helper Functions
-- =====================================================

-- Function to update all sample data to a real user ID
CREATE OR REPLACE FUNCTION public.update_sample_task_user_ids(target_user_id UUID)
RETURNS TABLE (
    updated_tasks INTEGER,
    updated_templates INTEGER,
    updated_instances INTEGER
) AS $$
DECLARE
    task_count INTEGER;
    template_count INTEGER;
    instance_count INTEGER;
BEGIN
    -- Update regular tasks and templates
    UPDATE public.tasks 
    SET user_id = target_user_id 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'
    AND template_id IS NULL;
    
    GET DIAGNOSTICS task_count = ROW_COUNT;
    
    -- Count templates specifically
    SELECT COUNT(*) INTO template_count 
    FROM public.tasks 
    WHERE user_id = target_user_id AND is_template = true;
    
    -- Update task instances (these should automatically reference the updated templates)
    UPDATE public.tasks 
    SET user_id = target_user_id 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'
    AND template_id IS NOT NULL;
    
    GET DIAGNOSTICS instance_count = ROW_COUNT;
    
    RETURN QUERY SELECT task_count, template_count, instance_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate additional task instances for testing
CREATE OR REPLACE FUNCTION public.generate_sample_task_instances(
    days_forward INTEGER DEFAULT 30,
    target_user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'
)
RETURNS INTEGER AS $$
DECLARE
    generated_count INTEGER := 0;
    template_record public.tasks%ROWTYPE;
    current_date DATE := CURRENT_DATE;
    end_date DATE := CURRENT_DATE + days_forward;
    temp_count INTEGER;
BEGIN
    -- Generate instances for all active templates
    FOR template_record IN 
        SELECT * FROM public.tasks 
        WHERE user_id = target_user_id 
        AND is_template = true 
        AND is_repeating = true 
    LOOP
        -- Use the existing function to generate instances
        SELECT COUNT(*) INTO temp_count
        FROM public.generate_task_instances_for_range(
            template_record.id,
            current_date,
            end_date
        );
        
        generated_count := generated_count + temp_count;
    END LOOP;
    
    RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clear all sample data
CREATE OR REPLACE FUNCTION public.clear_sample_tasks()
RETURNS TABLE (
    deleted_tasks INTEGER,
    deleted_templates INTEGER,
    deleted_instances INTEGER
) AS $$
DECLARE
    task_count INTEGER;
    template_count INTEGER;
    instance_count INTEGER;
BEGIN
    -- Count before deletion
    SELECT COUNT(*) INTO template_count 
    FROM public.tasks 
    WHERE user_id = '00000000-0000-0000-0000-000000000000' AND is_template = true;
    
    SELECT COUNT(*) INTO instance_count 
    FROM public.tasks 
    WHERE user_id = '00000000-0000-0000-0000-000000000000' AND template_id IS NOT NULL;
    
    -- Delete all sample data (CASCADE will handle instances)
    DELETE FROM public.tasks 
    WHERE user_id = '00000000-0000-0000-0000-000000000000';
    
    GET DIAGNOSTICS task_count = ROW_COUNT;
    
    RETURN QUERY SELECT task_count, template_count, instance_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Usage Examples:
-- =====================================================
/*
-- Update all sample data to your user ID:
SELECT * FROM public.update_sample_task_user_ids('your-user-id-here');

-- Generate additional instances for next 60 days:
SELECT public.generate_sample_task_instances(60, 'your-user-id-here');

-- Test the task statistics function:
SELECT * FROM public.get_user_task_statistics('your-user-id-here');

-- Clear all sample data:
SELECT * FROM public.clear_sample_tasks();

-- Generate tasks for a specific date range:
SELECT * FROM public.generate_task_instances_for_range(1, '2024-01-01', '2024-01-31');
*/

-- =====================================================
-- Usage Instructions:
-- =====================================================
--
-- 1. Ensure all migrations are applied first:
--    001_create_tasks_table.sql
--    002_setup_task_rls_policies.sql  
--    003_create_task_indexes.sql
--    004_create_task_functions.sql
--
-- 2. Uncomment the safety check line at the top of this file
--
-- 3. Run this script:
--    psql -h your-host -U postgres -d your-database -f sql/seed_data_tasks.sql
--
-- 4. Update placeholder user IDs:
--    SELECT * FROM public.update_sample_task_user_ids('your-actual-user-id');
--
-- 5. Generate additional test data if needed:
--    SELECT public.generate_sample_task_instances(30, 'your-user-id');
--
-- =====================================================