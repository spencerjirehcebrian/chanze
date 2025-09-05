import { supabase } from '../lib/supabase';
import type { Task, CreateTaskRequest, TaskTemplate } from '../types/database';

export class TaskService {
  // Core CRUD operations
  static async getAllTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', false) // Only get actual tasks, not templates
      .order('inserted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getTasksForDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', false)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const taskToInsert = {
      ...taskData,
      is_complete: false,
      is_repeating: taskData.is_repeating || false,
      is_template: false,
      priority: taskData.priority || 0,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskToInsert])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTaskTemplate(templateData: CreateTaskRequest): Promise<Task> {
    const template = {
      ...templateData,
      is_complete: false,
      is_repeating: true,
      is_template: true,
      priority: templateData.priority || 0,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createTaskInstance(templateId: number, dueDate: string): Promise<Task> {
    // Get the template
    const template = await this.getTask(templateId);
    if (!template || !template.is_template) {
      throw new Error('Template not found');
    }

    const instance = {
      task: template.task,
      user_id: template.user_id,
      due_date: dueDate,
      is_complete: false,
      is_repeating: false,
      is_template: false,
      template_id: templateId,
      priority: template.priority,
      tags: template.tags,
      notes: template.notes,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([instance])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTask(id: number): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async updateTask(
    id: number, 
    updates: Partial<Task>
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTask(id: number): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleTask(id: number, isComplete: boolean): Promise<Task> {
    const updates: Partial<Task> = { 
      is_complete: isComplete,
      completed_at: isComplete ? new Date().toISOString() : undefined
    };
    
    return this.updateTask(id, updates);
  }

  // Template management
  static async getTaskTemplates(): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', true)
      .eq('is_repeating', true)
      .order('inserted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getActiveTemplates(): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', true)
      .eq('is_repeating', true)
      .or('repeat_until.is.null,repeat_until.gte.' + new Date().toISOString().split('T')[0])
      .order('inserted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getTasksByPriority(priority: 0 | 1 | 2): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', false)
      .eq('priority', priority)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_template', false)
      .eq('is_complete', false)
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async deleteAllInstancesForTemplate(templateId: number): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('template_id', templateId);

    if (error) throw error;
  }

  // Legacy compatibility methods
  static async getAllTodos(): Promise<Task[]> {
    return this.getAllTasks();
  }

  static async createTodo(taskData: CreateTaskRequest): Promise<Task> {
    return this.createTask(taskData);
  }

  static async updateTodo(id: number, updates: Partial<Task>): Promise<Task> {
    return this.updateTask(id, updates);
  }

  static async deleteTodo(id: number): Promise<void> {
    return this.deleteTask(id);
  }

  static async toggleTodo(id: number, isComplete: boolean): Promise<Task> {
    return this.toggleTask(id, isComplete);
  }
}

// Legacy export for backward compatibility
export const TodoService = TaskService;