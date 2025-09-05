# Database Migration Guide for Self-Hosted Supabase

This guide explains how to set up the database schema for your todo application on a self-hosted Supabase instance.

## 📋 Prerequisites

- Self-hosted Supabase instance running
- PostgreSQL access (psql command or database client)
- Database connection details (host, port, username, password)

## 🗂️ File Structure

```
sql/
├── migrations/
│   ├── 001_create_todos_table.sql    # Main todos table
│   ├── 002_setup_rls_policies.sql    # Row Level Security
│   └── 003_create_indexes.sql        # Performance indexes
├── seed_data.sql                     # Sample data (development only)
└── drop_tables.sql                   # Cleanup script
```

## 🚀 Migration Steps

### Step 1: Connect to Your Database

```bash
# Connect via psql (replace with your details)
psql 'postgres://postgres.your-tenant-id:your-super-secret-and-long-postgres-password@localhost:5432/postgres'
```

### Step 2: Run Migrations in Order

**Important:** Run these in the exact order shown!

```sql
-- Migration 1: Create the todos table
\i sql/migrations/001_create_todos_table.sql

-- Migration 2: Set up Row Level Security
\i sql/migrations/002_setup_rls_policies.sql

-- Migration 3: Create performance indexes
\i sql/migrations/003_create_indexes.sql
```

### Step 3: Configure Supabase Authentication (Required!)

In your **Supabase Dashboard**:

1. Go to **Authentication → Settings**
2. In the **Email Auth** section:
   - ✅ Keep **"Enable sign ups"** enabled
   - ❌ **Disable "Enable email confirmations"** (for no-confirmation signup)
   - ✅ Set appropriate **site URL** for redirects

### Step 4: Verify Migration Success

```sql
-- Check table was created
SELECT * FROM information_schema.tables WHERE table_name = 'todos';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'todos';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'todos';

-- Test basic functionality (replace with real user ID)
SELECT * FROM public.todos LIMIT 5;
```

## 🧪 Development Setup (Optional)

### Load Sample Data

1. **First, create test users** in Supabase Dashboard:

   - Go to **Authentication → Users**
   - Click **"Add user"**
   - Create 1-2 test users
   - Copy their user IDs (UUIDs)

2. **Update seed data file:**

   ```bash
   # Edit sql/seed_data.sql
   # Replace the test UUIDs with your real user IDs
   ```

3. **Load the seed data:**
   ```sql
   \i sql/seed_data.sql
   ```

## 🔒 Security Configuration

The migrations automatically set up:

- **Row Level Security (RLS)** - Users can only see their own todos
- **Authentication policies** - All operations require valid auth
- **Data validation** - Task length limits, required fields
- **Audit trails** - Created/updated timestamps

## 🔧 Troubleshooting

### Common Issues:

**1. "relation auth.users does not exist"**

```bash
# Ensure Supabase auth is properly initialized
# This should exist by default in Supabase
```

**2. "permission denied for schema auth"**

```sql
-- Run this as a superuser
GRANT USAGE ON SCHEMA auth TO authenticated;
```

**3. "could not create unique index concurrently"**

```sql
-- Drop and recreate indexes normally (not concurrently)
DROP INDEX IF EXISTS idx_todos_user_id_inserted_at;
CREATE INDEX idx_todos_user_id_inserted_at ON public.todos (user_id, inserted_at);
```

**4. RLS blocking all queries**

```sql
-- Test if user is properly authenticated
SELECT auth.uid(); -- Should return your user ID, not NULL
```

## 📊 Database Schema

### `todos` Table Structure

| Column        | Type        | Constraints                    | Description          |
| ------------- | ----------- | ------------------------------ | -------------------- |
| `id`          | BIGSERIAL   | PRIMARY KEY                    | Auto-incrementing ID |
| `task`        | TEXT        | NOT NULL, CHECK(length 1-1000) | Todo description     |
| `is_complete` | BOOLEAN     | NOT NULL DEFAULT false         | Completion status    |
| `user_id`     | UUID        | REFERENCES auth.users(id)      | Owner user ID        |
| `inserted_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW()         | Creation time        |
| `updated_at`  | TIMESTAMPTZ | NOT NULL DEFAULT NOW()         | Last modified        |

### Indexes for Performance

- `idx_todos_user_id_inserted_at` - Main query optimization
- `idx_todos_user_id_is_complete` - Filter by completion
- `idx_todos_user_id_complete_inserted` - Complex queries
- `idx_todos_user_task_text` - Text search (future feature)
- `idx_todos_updated_at` - Audit queries

## 🔄 Rollback/Cleanup

### To completely remove everything:

```sql
-- BE CAREFUL - This deletes all data!
\i sql/drop_tables.sql
```

### To reset and re-run migrations:

```bash
# 1. Backup first (optional)
pg_dump -h your-host -U postgres -d postgres > backup.sql

# 2. Clean up
psql -h your-host -U postgres -d postgres -f sql/drop_tables.sql

# 3. Re-run migrations
psql -h your-host -U postgres -d postgres -f sql/migrations/001_create_todos_table.sql
psql -h your-host -U postgres -d postgres -f sql/migrations/002_setup_rls_policies.sql
psql -h your-host -U postgres -d postgres -f sql/migrations/003_create_indexes.sql
```

## ✅ Verification Checklist

After running migrations, verify:

- [ ] `todos` table exists with correct columns
- [ ] RLS is enabled with 5 policies
- [ ] 5+ indexes created for performance
- [ ] Can create/read/update/delete todos via your app
- [ ] Users can only see their own todos
- [ ] Authentication signup/login works without email confirmation

## 🆘 Support

If you encounter issues:

1. Check the PostgreSQL logs for detailed error messages
2. Verify Supabase auth is properly configured
3. Ensure your connection has proper permissions
4. Test with a simple authenticated query first

---

**🎉 You're ready to go!** Your todo application database is now properly configured with security, performance, and scalability in mind.
