export interface Task {
  // Core fields
  id: number;
  task: string;
  is_complete: boolean;
  user_id: string;
  inserted_at: string;
  
  // Scheduling fields
  due_date?: string;
  completed_at?: string;
  
  // Repeating task fields
  is_repeating: boolean;
  repeat_days?: number[]; // [0,1,2,3,4,5,6] for days of week (0=Sunday)
  repeat_until?: string;
  template_id?: number;
  is_template: boolean;
  
  // Enhanced task management
  priority: 0 | 1 | 2; // 0=low, 1=medium, 2=high
  tags?: string[];
  notes?: string;
}

export interface User {
  id: string;
  email?: string;
  created_at: string;
}

// Type helpers for task operations
export type TaskTemplate = Task & {
  is_template: true;
  template_id?: null;
}

export type TaskInstance = Task & {
  is_template: false;
  template_id: number;
}

export type RegularTask = Task & {
  is_template: false;
  template_id?: null;
  is_repeating: false;
}

export interface CreateTaskRequest {
  task: string;
  user_id: string;
  due_date?: string;
  is_repeating?: boolean;
  repeat_days?: number[];
  repeat_until?: string;
  priority?: 0 | 1 | 2;
  tags?: string[];
  notes?: string;
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'inserted_at'>;
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'inserted_at'>>;
      };
    };
  };
}

// Legacy Todo interface for backward compatibility during migration
export interface Todo extends Task {
  // Empty interface extending Task - no additional properties needed
}