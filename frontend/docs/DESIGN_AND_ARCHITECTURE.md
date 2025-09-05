# Chanze - Design and Architecture

## Overview

Chanze is a modern, enterprise-grade task management application built with a focus on scalability, performance, and user experience. The application provides advanced task scheduling, template management, and on-demand task generation capabilities while maintaining simplicity and ease of use.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │ ── │  Supabase BaaS  │ ── │   PostgreSQL    │
│   (Frontend)    │    │  (Backend API)  │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- **React 19.1** - Modern React with concurrent features
- **TypeScript 5.8** - Type safety and developer experience  
- **Vite 7.1** - Fast build tool and development server
- **TanStack Query 5.85** - Server state management and caching
- **Tailwind CSS 4.1** - Utility-first styling with v4 features
- **Zustand 5.0** - Lightweight client state management
- **Radix UI** - Accessible, unstyled component primitives

**Backend & Database:**
- **Supabase** - Backend-as-a-Service (BaaS) platform
- **PostgreSQL** - Primary database with advanced features
- **Row Level Security (RLS)** - Database-level security policies
- **PostgREST API** - Auto-generated RESTful API

**Development Tools:**
- **ESLint 9.33** - Code linting and quality
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Next Themes 0.4** - Dark/light theme management

## Core Features

### 1. Advanced Task Management

The task management system is built around a sophisticated template-instance architecture that supports complex recurring patterns while maintaining database efficiency and user flexibility.

#### Task Types and Hierarchy

**1. Regular Tasks (One-off Tasks)**
```typescript
interface RegularTask {
  is_template: false;
  template_id: null;
  is_repeating: false;
  // Standard task fields: task, due_date, priority, etc.
}
```
- Simple, standalone tasks with no recurrence
- Created directly by users for specific one-time activities
- Example: "Prepare presentation for Monday meeting"

**2. Task Templates (Master Patterns)**
```typescript
interface TaskTemplate {
  is_template: true;
  is_repeating: true;
  template_id: null;
  repeat_days: number[];     // [1,2,3,4,5] for weekdays
  repeat_until?: string;     // Optional end date
  // Task content and metadata that instances inherit
}
```
- Master definitions that spawn task instances
- Define the recurring pattern and scheduling rules
- Contain all metadata that instances inherit (priority, tags, notes)
- Never shown in daily task lists - only used for generation
- Example Template: "Daily standup meeting" with repeat_days=[1,2,3,4,5]

**3. Task Instances (Generated Occurrences)**
```typescript
interface TaskInstance {
  is_template: false;
  template_id: number;      // References the parent template
  is_repeating: false;
  due_date: string;         // Specific occurrence date
  // Inherits: task content, priority, tags, notes from template
}
```
- Concrete tasks generated from templates for specific dates
- Appear in daily task lists and can be completed/modified
- Changes to instances don't affect the template or other instances
- Example Instance: "Daily standup meeting" for "2024-01-15"

#### Advanced Scheduling Patterns

**Repeat Days Configuration**
```typescript
// Days of week represented as integers
const DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

// Common patterns
const patterns = {
  weekdays: [1, 2, 3, 4, 5],           // Monday-Friday
  weekends: [0, 6],                    // Saturday-Sunday  
  daily: [0, 1, 2, 3, 4, 5, 6],       // Every day
  custom: [1, 3, 5],                  // Monday, Wednesday, Friday
};
```

**Template Lifecycle Management**
- Templates can have start dates (due_date) and end dates (repeat_until)
- Active templates generate instances within their date range
- Expired templates (past repeat_until) stop generating new instances
- Templates can be deactivated by setting is_repeating=false

#### Priority and Metadata System

**Three-Tier Priority System**
```typescript
enum Priority {
  LOW = 0,      // Optional, low urgency tasks
  MEDIUM = 1,   // Standard priority (default)
  HIGH = 2      // Urgent, important tasks
}
```

**Rich Metadata Support**
- **Tags**: Array of strings for categorization (`tags: ['work', 'meeting', 'urgent']`)
- **Notes**: Free-form text for additional context and details
- **Timestamps**: Automatic tracking of creation, updates, and completion
- **User Assignment**: Every task tied to specific user via user_id

#### Task State Management

**Completion Tracking**
```typescript
interface TaskState {
  is_complete: boolean;
  completed_at?: string;    // ISO timestamp when completed
  updated_at: string;       // Last modification timestamp
}
```

**State Transitions**
1. **Created** → Task instance generated from template or created manually
2. **Active** → Task visible in user's task list, can be worked on
3. **Completed** → User marks task done, completed_at timestamp set
4. **Archived** → Old completed tasks cleaned up by maintenance functions

### 2. Smart Scheduling System

The scheduling system implements on-demand task generation to provide infinite scalability while maintaining optimal database performance.

#### On-Demand Generation Architecture

**Core Principle**: Tasks are generated only when needed, not pre-computed in advance.

```typescript
class TaskScheduleService {
  /**
   * Master function: Gets tasks for calendar view with smart generation
   */
  static async getTasksForDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    // 1. Get existing task instances in range
    const existingTasks = await TaskService.getTasksForDateRange(startDate, endDate);
    
    // 2. Get active templates that could generate tasks in this range  
    const activeTemplates = await TaskService.getActiveTemplates();
    
    // 3. Calculate which instances are missing
    const missingInstances = await this.calculateMissingInstances(
      activeTemplates, existingTasks, startDate, endDate
    );
    
    // 4. Generate missing instances on-the-fly
    const newInstances = await this.generateMissingInstances(missingInstances);
    
    // 5. Return combined and sorted results
    return [...existingTasks, ...newInstances].sort(byDueDate);
  }
}
```

#### Template Evaluation Logic

**PostgreSQL Function: should_generate_task_on_date()**
```sql
CREATE OR REPLACE FUNCTION public.should_generate_task_on_date(
    template_record public.tasks,
    target_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Verify it's a valid repeating template
    IF NOT template_record.is_template OR NOT template_record.is_repeating THEN
        RETURN FALSE;
    END IF;
    
    -- 2. Check repeat pattern configuration
    IF template_record.repeat_days IS NULL OR array_length(template_record.repeat_days, 1) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- 3. Check if target date matches repeat pattern
    IF NOT (EXTRACT(DOW FROM target_date) = ANY(template_record.repeat_days)) THEN
        RETURN FALSE;
    END IF;
    
    -- 4. Verify date is within template's active period
    IF template_record.due_date IS NOT NULL AND target_date < template_record.due_date THEN
        RETURN FALSE;
    END IF;
    
    IF template_record.repeat_until IS NOT NULL AND target_date > template_record.repeat_until THEN
        RETURN FALSE;
    END IF;
    
    -- 5. Ensure instance doesn't already exist
    IF EXISTS (
        SELECT 1 FROM public.tasks 
        WHERE template_id = template_record.id 
        AND due_date = target_date
        AND user_id = template_record.user_id
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### Calendar Integration Patterns

**Week View Implementation**
```typescript
// Generate tasks for current week
const getWeekTasks = async (currentDate: Date) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  
  return TaskScheduleService.getTasksForDateRange(startOfWeek, endOfWeek);
};
```

**Month View Implementation**
```typescript
// Generate tasks for current month
const getMonthTasks = async (currentDate: Date) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  return TaskScheduleService.getTasksForDateRange(startOfMonth, endOfMonth);
};
```

#### Advanced Scheduling Features

**Next Occurrence Calculation**
```typescript
static getNextOccurrence(template: TaskTemplate, fromDate: Date = new Date()): Date | null {
  if (!template.is_repeating || !template.repeat_days?.length) return null;
  
  const searchDate = new Date(fromDate);
  searchDate.setDate(searchDate.getDate() + 1); // Start from tomorrow
  
  // Search up to 14 days to prevent infinite loops
  for (let i = 0; i < 14; i++) {
    if (this.isTaskDueOnDate(template, searchDate)) {
      return new Date(searchDate);
    }
    searchDate.setDate(searchDate.getDate() + 1);
  }
  
  return null;
}
```

**Smart Deletion with User Choice**
```typescript
enum DeletionType {
  THIS = 'this',     // Delete only this instance
  FUTURE = 'future', // Delete this and all future instances  
  ALL = 'all'        // Delete entire recurring series
}

static async deleteTaskWithOptions(taskId: number, deleteType: DeletionType) {
  const task = await TaskService.getTask(taskId);
  
  switch (deleteType) {
    case 'this':
      await TaskService.deleteTask(taskId);
      break;
      
    case 'future':
      await TaskService.deleteTask(taskId);
      if (task.template_id) {
        // End the template series before this task's date
        const endDate = new Date(task.due_date);
        endDate.setDate(endDate.getDate() - 1);
        
        await TaskService.updateTask(task.template_id, {
          repeat_until: endDate.toISOString().split('T')[0]
        });
      }
      break;
      
    case 'all':
      if (task.template_id || task.is_template) {
        // Deactivate template and clean up all instances
        const templateId = task.template_id || task.id;
        await TaskService.updateTask(templateId, { 
          is_repeating: false,
          repeat_until: new Date().toISOString().split('T')[0]
        });
        await TaskService.deleteAllInstancesForTemplate(templateId);
      }
      break;
  }
}
```

#### Performance Optimizations

**Database Query Optimization**
- Composite indexes on (user_id, due_date) for fast range queries
- Template lookup optimization with (user_id, is_template, is_repeating) index
- Instance lookup optimization with (template_id, due_date) index

**Caching Strategy**
- TanStack Query caches generated task instances
- Template data cached separately with longer TTL
- Calendar queries use background refetching for smooth UX

**Lazy Loading Benefits**
- Database size remains constant regardless of template complexity
- No storage overhead for future tasks until actually viewed
- Instant template modifications affect future generations immediately
- Perfect for users with complex recurring schedules (hundreds of templates)

### 3. Enterprise Security

- **Row Level Security (RLS)**: User isolation at database level
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Policy-based access control
- **Data Validation**: Both client and server-side validation
- **SQL Injection Prevention**: Parameterized queries via PostgREST

## Database Design

### Core Schema

```sql
-- Main tasks table supporting both templates and instances
CREATE TABLE public.tasks (
    id BIGSERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    is_complete BOOLEAN DEFAULT false,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Template/Instance System
    is_template BOOLEAN DEFAULT false,
    is_repeating BOOLEAN DEFAULT false,
    template_id BIGINT REFERENCES tasks(id),
    repeat_days INTEGER[],        -- [0,1,2,3,4,5,6] for days of week
    repeat_until DATE,
    
    -- Enhanced Features  
    priority INTEGER DEFAULT 0,   -- 0=low, 1=medium, 2=high
    tags TEXT[],
    notes TEXT,
    
    -- Timestamps
    inserted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Design Patterns

**Template-Instance Pattern:**
- Templates (is_template=true): Define recurring task patterns
- Instances (template_id IS NOT NULL): Specific occurrences from templates  
- Regular Tasks (is_template=false, template_id=NULL): One-off tasks

**On-Demand Generation:**
- Tasks created only when calendar date ranges are viewed
- Prevents database bloat from thousands of pre-generated tasks
- Utilizes PostgreSQL utility functions for smart generation

### Database Functions

The system includes 8 comprehensive utility functions:

1. **should_generate_task_on_date()** - Determines if template should create instance
2. **get_next_task_occurrence()** - Finds next valid occurrence date
3. **generate_task_instances_for_range()** - Bulk generates missing instances
4. **cleanup_completed_task_instances()** - Removes old completed tasks
5. **validate_repeat_pattern()** - Validates repeat day arrays
6. **get_repeat_pattern_description()** - Human-readable pattern descriptions
7. **get_user_task_statistics()** - Comprehensive user metrics
8. **bulk_update_task_priority()** - Batch priority updates

## Frontend Architecture

### Component Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Input, Modal, etc.)
│   ├── forms/           # Form components (LoginForm, TaskForm, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── features/        # Feature-specific components
│   │   └── auth/        # Authentication components
│   ├── providers/       # Context providers
│   └── task/            # Task-related components
├── hooks/               # Custom React hooks
│   ├── useTasks.ts      # Task management hooks
│   ├── useAuth.ts       # Authentication hooks
│   └── common/          # Shared utility hooks
├── services/            # API and business logic
│   ├── TaskService.ts          # Core CRUD operations
│   ├── TaskScheduleService.ts  # Scheduling logic
│   └── api/             # API abstraction layer
├── types/               # TypeScript type definitions
├── lib/                 # Utility libraries and configs
└── pages/               # Page components
```

### State Management Strategy

**Server State (TanStack Query):**
- API data caching and synchronization
- Optimistic updates for better UX
- Background refetching and stale-while-revalidate
- Query invalidation for data consistency

**Client State (Zustand):**
- UI state (theme, sidebar, modals)
- User preferences and settings
- Temporary form data and filters

**Authentication State (Supabase Auth):**
- User session management
- JWT token handling
- Automatic token refresh

### Service Layer Architecture

**TaskService (Core CRUD):**
- getAllTasks(), createTask(), updateTask(), deleteTask()
- Template management: createTaskTemplate(), getTaskTemplates()
- Instance creation: createTaskInstance()
- Filtering: getTasksByPriority(), getOverdueTasks()

**TaskScheduleService (Smart Scheduling):**
- On-demand task generation: getTasksForDateRange()
- Calendar integration: getDateRange()
- Smart deletion: deleteTaskWithOptions()
- Next occurrence calculation: getNextOccurrence()

## Security Model

### Row Level Security (RLS) Policies

```sql
-- Users can only view their own tasks
CREATE POLICY "Users can view their tasks" ON tasks
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Users can only create tasks for themselves
CREATE POLICY "Users can create their tasks" ON tasks
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Template-instance relationship validation
CREATE POLICY "Users can create their tasks" ON tasks
WITH CHECK (
    -- Validate template ownership before creating instances
    template_id IS NULL OR EXISTS (
        SELECT 1 FROM tasks t WHERE t.id = template_id 
        AND t.user_id = auth.uid() AND t.is_template = true
    )
);
```

### Data Validation Layers

1. **Client-side**: TypeScript types and form validation
2. **API Layer**: Supabase PostgREST validation  
3. **Database**: CHECK constraints and triggers
4. **RLS Policies**: User isolation and access control

## Performance Optimizations

### Database Performance

**Indexes:**
```sql
-- Core performance indexes
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_tasks_user_template ON tasks(user_id, is_template, is_repeating);
CREATE INDEX idx_tasks_template_instances ON tasks(template_id, due_date);
```

**Query Optimization:**
- Composite indexes for common query patterns
- Efficient date range queries for calendar views
- Template lookup optimization for instance generation

### Frontend Performance

**Code Splitting:**
- Lazy-loaded routes and components
- Dynamic imports for large dependencies

**Caching Strategy:**
- TanStack Query for server state caching
- Stale-while-revalidate for better perceived performance
- Background updates and optimistic mutations

**Bundle Optimization:**
- Vite's native ESM and tree-shaking
- Modern JavaScript targeting
- CSS purging and optimization

## Scalability Considerations

### Database Scalability

**On-Demand Generation:**
- Prevents exponential growth of pre-generated tasks
- Scales linearly with active date ranges viewed
- Database cleanup functions for maintenance

**Horizontal Scaling:**
- Supabase provides automatic scaling
- Read replicas for query distribution
- Connection pooling and caching

### Frontend Scalability

**Component Architecture:**
- Modular, reusable component design
- Clear separation of concerns
- Standardized API patterns

**State Management:**
- Normalized data structures
- Efficient re-renders with React Query
- Minimal client state footprint

## Development Workflow

### Build Process

```bash
npm run dev      # Development server with HMR
npm run build    # Production build with TypeScript checking
npm run lint     # ESLint code quality checks
npm run preview  # Preview production build
```

### Migration System

```bash
sql/migrations/
├── 001_create_tasks_table.sql      # Core schema
├── 002_setup_rls_policies.sql      # Security policies  
├── 003_create_indexes.sql          # Performance indexes
└── 004_create_task_functions.sql   # Utility functions
```

**Migration Features:**
- Idempotent migrations (safe to re-run)
- Comprehensive validation and verification
- Rollback scripts for disaster recovery
- Detailed logging and error reporting

### Code Quality

**TypeScript Configuration:**
- Strict type checking enabled
- Path mapping for clean imports
- Module resolution optimization

**ESLint Configuration:**
- React-specific rules and hooks
- TypeScript-aware linting
- Import/export validation
- Code complexity analysis

## Deployment Architecture

### Environment Configuration

```bash
# Required Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production Considerations

**Security:**
- Environment variable validation
- Secure API key management
- HTTPS enforcement
- CSP headers for XSS prevention

**Performance:**
- Static asset optimization
- CDN integration capabilities
- Compression and caching headers
- Service worker potential for offline functionality

**Monitoring:**
- Error boundaries for graceful failures
- Client-side error reporting integration points
- Performance metrics collection hooks

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Service layer testing with mock data
- Utility function testing

### Integration Testing  
- API integration testing
- Database query testing
- End-to-end user flows

### Performance Testing
- Load testing for database queries
- Frontend performance profiling
- Bundle size monitoring

## Future Enhancements

### Planned Features
- Real-time collaboration with Supabase Realtime
- Advanced analytics and reporting
- Mobile-responsive PWA capabilities
- Batch operations and bulk editing
- Task dependencies and project management
- Calendar integrations (Google Calendar, Outlook)

### Technical Improvements
- Service worker for offline functionality
- Advanced caching strategies
- Micro-frontend architecture for larger teams
- GraphQL integration for complex queries
- Advanced monitoring and observability

## Conclusion

Chanze represents a modern approach to task management applications, leveraging cutting-edge technologies and architectural patterns to deliver a scalable, performant, and maintainable solution. The combination of React's component architecture, Supabase's powerful backend services, and PostgreSQL's advanced database features creates a robust foundation for enterprise-grade task management capabilities.

The on-demand task generation system and comprehensive security model ensure the application can scale efficiently while maintaining data integrity and user privacy. The modular architecture and clear separation of concerns make the codebase maintainable and extensible for future enhancements.