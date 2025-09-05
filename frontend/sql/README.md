# Task Management System - Database Setup

A comprehensive PostgreSQL database schema for a modern task management system with advanced features including templates, on-demand instance generation, scheduling, and team collaboration.

## 🚀 Quick Start

### Prerequisites

- PostgreSQL 14+ (with extensions enabled)
- Supabase account (or standalone PostgreSQL with auth schema)
- Command-line access to your database

### Installation

1. **Apply migrations in order:**
   ```bash
   psql -h your-host -U postgres -d your-database -f sql/migrations/001_create_tasks_table.sql
   psql -h your-host -U postgres -d your-database -f sql/migrations/002_setup_task_rls_policies.sql
   psql -h your-host -U postgres -d your-database -f sql/migrations/003_create_task_indexes.sql
   psql -h your-host -U postgres -d your-database -f sql/migrations/004_create_task_functions.sql
   ```

2. **Add sample data (optional):**
   ```bash
   psql -h your-host -U postgres -d your-database -f sql/seed_data_tasks.sql
   ```

3. **Update sample data with your user ID:**
   ```sql
   SELECT * FROM public.update_sample_task_user_ids('your-user-id-here');
   ```

## 📊 Features

### Core Task Management
- ✅ **Full CRUD operations** with proper validation
- ✅ **Rich task properties**: due dates, priorities, tags, notes
- ✅ **Completion tracking** with automatic timestamps
- ✅ **User isolation** with Row Level Security (RLS)

### Template & Scheduling System
- ✅ **Template tasks** for repeating patterns
- ✅ **On-demand instance generation** (no pre-creation bloat)
- ✅ **Flexible repeat patterns**: daily, weekly, custom days
- ✅ **Smart scheduling** with date range controls

### Performance & Scalability
- ✅ **13 optimized indexes** including GIN indexes for arrays/search
- ✅ **Partial indexes** for targeted query optimization
- ✅ **Full-text search** across task content and notes
- ✅ **Query analysis tools** for performance monitoring

### Security & Validation
- ✅ **Comprehensive RLS policies** for multi-user safety
- ✅ **Data integrity triggers** and constraint validation
- ✅ **Template relationship validation**
- ✅ **Anonymous access prevention**

## 🏗️ Architecture

### Database Schema

```sql
-- Core task structure
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id),
    
    -- Scheduling
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Templates & Repeating
    is_template BOOLEAN DEFAULT false,
    is_repeating BOOLEAN DEFAULT false,
    repeat_days INTEGER[],  -- [0=Sun, 1=Mon, ..., 6=Sat]
    repeat_until DATE,
    template_id BIGINT REFERENCES tasks(id),
    
    -- Enhanced features
    priority INTEGER DEFAULT 0,  -- 0=low, 1=medium, 2=high
    tags TEXT[],
    notes TEXT,
    
    -- Timestamps
    inserted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Concepts

#### 1. Template/Instance Pattern
```sql
-- Create a template for daily exercise
INSERT INTO tasks (task, is_template, is_repeating, repeat_days, user_id)
VALUES ('Morning workout', true, true, ARRAY[1,2,3,4,5], 'user-id');

-- Generate instances for next week
SELECT * FROM generate_task_instances_for_range(template_id, '2024-01-01', '2024-01-07');
```

#### 2. On-Demand Generation
The system generates task instances only when needed (e.g., when viewing a calendar range), preventing database bloat from pre-generated future tasks.

#### 3. Smart Repeat Patterns
```sql
-- Weekdays only: ARRAY[1,2,3,4,5]
-- Weekends only: ARRAY[0,6] 
-- Every day: ARRAY[0,1,2,3,4,5,6]
-- Custom: ARRAY[1,3,5] (Mon, Wed, Fri)
```

## 📋 Migration Details

### 001_create_tasks_table.sql
- **Purpose**: Creates the core tasks table with comprehensive schema
- **Features**: All field definitions, constraints, triggers, and base functionality
- **Dependencies**: Requires Supabase `auth.users` table

### 002_setup_task_rls_policies.sql  
- **Purpose**: Implements Row Level Security for multi-user isolation
- **Features**: CRUD policies, template validation, security functions
- **Dependencies**: Requires 001_create_tasks_table.sql

### 003_create_task_indexes.sql
- **Purpose**: Performance optimization with 13 specialized indexes
- **Features**: Composite indexes, GIN indexes, partial indexes, full-text search
- **Dependencies**: Requires 001_create_tasks_table.sql

### 004_create_task_functions.sql
- **Purpose**: Utility functions for advanced task operations
- **Features**: 8 functions including on-demand generation, statistics, validation
- **Dependencies**: Requires all previous migrations

## 🔧 Utility Functions

### Task Generation
```sql
-- Check if template should generate task on specific date
SELECT should_generate_task_on_date(template_record, '2024-01-15');

-- Find next occurrence date
SELECT get_next_task_occurrence(template_id, CURRENT_DATE);

-- Generate instances for date range
SELECT * FROM generate_task_instances_for_range(1, '2024-01-01', '2024-01-31');
```

### Analytics & Management
```sql
-- Get comprehensive user statistics
SELECT * FROM get_user_task_statistics();

-- Bulk update task priorities
SELECT bulk_update_task_priority(ARRAY[1,2,3], 2); -- Set to high priority

-- Clean up old completed tasks
SELECT cleanup_completed_task_instances(90); -- Older than 90 days
```

### Validation & Helpers
```sql
-- Validate repeat pattern array
SELECT validate_repeat_pattern(ARRAY[1,2,3,4,5]); -- Returns true

-- Get human-readable description
SELECT get_repeat_pattern_description(ARRAY[1,2,3,4,5]); 
-- Returns: "Weekdays (Monday to Friday)"
```

## 🎯 Sample Data

The seed data includes:
- **16 realistic tasks** with various priorities, due dates, and features
- **6 template tasks** demonstrating different repeat patterns
- **Generated instances** from templates showing the system in action
- **Helper functions** for managing sample data

### Working with Sample Data

```sql
-- Update all sample data to your user ID
SELECT * FROM update_sample_task_user_ids('your-user-id');

-- Generate more test instances
SELECT generate_sample_task_instances(30, 'your-user-id'); -- Next 30 days

-- Clear all sample data
SELECT * FROM clear_sample_tasks();
```

## 🔍 Query Examples

### Basic Operations
```sql
-- Get active tasks for user
SELECT * FROM tasks 
WHERE user_id = 'user-id' AND is_template = false AND is_complete = false
ORDER BY priority DESC, due_date ASC NULLS LAST;

-- Find overdue tasks
SELECT * FROM tasks 
WHERE user_id = 'user-id' AND due_date < CURRENT_DATE AND is_complete = false;

-- Search tasks by content
SELECT * FROM tasks 
WHERE user_id = 'user-id' 
AND to_tsvector('english', task || ' ' || COALESCE(notes, '')) @@ plainto_tsquery('meeting');
```

### Advanced Queries
```sql
-- Calendar view for specific date range
SELECT * FROM tasks 
WHERE user_id = 'user-id' AND is_template = false
AND due_date BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY due_date, priority DESC;

-- Tasks by tag
SELECT * FROM tasks 
WHERE user_id = 'user-id' AND tags && ARRAY['work', 'urgent'];

-- Template management
SELECT * FROM tasks 
WHERE user_id = 'user-id' AND is_template = true 
ORDER BY task;
```

## 🚨 Cleanup & Maintenance

### Complete System Removal
```bash
# WARNING: This permanently deletes ALL task data!
psql -h your-host -U postgres -d your-database -f sql/drop_tables.sql
```

### Maintenance Operations
```sql
-- Analyze query performance
SELECT * FROM analyze_task_query_performance();

-- Clean up old completed instances (automated cleanup recommended)
SELECT cleanup_completed_task_instances(90);

-- Check database statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE tablename = 'tasks';
```

## 🛡️ Security Features

### Row Level Security (RLS)
- **User isolation**: Each user can only access their own tasks
- **Template validation**: Prevents invalid template/instance relationships  
- **Anonymous blocking**: Completely blocks unauthenticated access
- **Operation validation**: Ensures proper task state transitions

### Data Integrity
- **Constraint validation**: Comprehensive CHECK constraints
- **Trigger validation**: Business logic enforcement
- **Foreign key relationships**: Maintains referential integrity
- **Type safety**: Enum types and array validation

## 📈 Performance Optimization

### Indexing Strategy
The system includes 13 specialized indexes:
- **Primary operations**: User task listing, completion filtering
- **Scheduling queries**: Due date ranges, calendar views  
- **Template management**: Template/instance relationships
- **Advanced features**: Tag filtering, full-text search, overdue detection

### Query Optimization Tips
1. **Always include `user_id`** in WHERE clauses to leverage RLS indexes
2. **Use `is_template = false`** filters to exclude templates from task listings
3. **Leverage composite indexes** by including multiple relevant columns
4. **Use array operators** (`&&`) for efficient tag filtering
5. **Utilize date ranges** instead of individual date queries

## 🔄 Migration Workflow

### Fresh Installation
1. Ensure PostgreSQL 14+ with required extensions
2. Run migrations 001-004 in sequence
3. Optionally add seed data
4. Update sample user IDs to real authenticated users

### Updates & Changes
1. Always backup before schema changes
2. Test migrations on development database first
3. Use `CONCURRENTLY` for index operations in production
4. Monitor performance after applying changes

### Rollback Support
Each migration includes rollback commands in comments. For complete rollback, use `drop_tables.sql`.

## 📞 Support & Troubleshooting

### Common Issues

**Migration Failures**
- Ensure previous migrations completed successfully
- Check PostgreSQL version compatibility (14+)
- Verify `auth.users` table exists (Supabase requirement)

**Performance Issues**  
- Run `ANALYZE tasks;` after large data changes
- Check index usage with `EXPLAIN (ANALYZE, BUFFERS)`
- Consider `VACUUM` for heavily modified tables

**RLS Policy Errors**
- Ensure authenticated user context (`auth.uid()` returns valid UUID)
- Check user permissions on `auth` schema
- Verify RLS is enabled: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'tasks';`

### Getting Help
1. Check the migration logs for specific error messages
2. Use the included utility functions for debugging
3. Review the comprehensive comments in each migration file
4. Test queries against sample data first

---

**Built for modern task management applications with enterprise-ready PostgreSQL architecture.**