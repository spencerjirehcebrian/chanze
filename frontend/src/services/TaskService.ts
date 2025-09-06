import { httpClient } from '../lib/axios';
import type { Task, CreateTaskRequest, TaskTemplate } from '../types/database';

export class TaskService {
  private static readonly BASE_PATH = '/tasks';

  // Core CRUD operations
  static async getAllTasks(): Promise<Task[]> {
    try {
      const response = await httpClient.get<Task[]>(`${this.BASE_PATH}?is_template=false`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  static async getTasksForDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    try {
      const params = new URLSearchParams({
        is_template: 'false',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      
      const response = await httpClient.get<Task[]>(`${this.BASE_PATH}?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks for date range:', error);
      throw new Error('Failed to fetch tasks for date range');
    }
  }

  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const taskToCreate = {
        ...taskData,
        is_complete: false,
        is_repeating: taskData.is_repeating || false,
        is_template: false,
        priority: taskData.priority || 0,
      };

      const response = await httpClient.post<Task>(this.BASE_PATH, taskToCreate);
      if (!response.data) {
        throw new Error('No data returned from create task');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error('Failed to create task');
    }
  }

  static async createTaskTemplate(templateData: CreateTaskRequest): Promise<Task> {
    try {
      const template = {
        ...templateData,
        is_complete: false,
        is_repeating: true,
        is_template: true,
        priority: templateData.priority || 0,
      };

      const response = await httpClient.post<Task>(`${this.BASE_PATH}/templates`, template);
      if (!response.data) {
        throw new Error('No data returned from create template');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create task template:', error);
      throw new Error('Failed to create task template');
    }
  }

  static async createTaskInstance(templateId: number, dueDate: string): Promise<Task> {
    try {
      const response = await httpClient.post<Task>(`${this.BASE_PATH}/templates/${templateId}/instances`, {
        due_date: dueDate
      });
      if (!response.data) {
        throw new Error('No data returned from create task instance');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create task instance:', error);
      throw new Error('Failed to create task instance');
    }
  }

  static async getTask(id: number): Promise<Task | null> {
    try {
      const response = await httpClient.get<Task>(`${this.BASE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  }

  static async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await httpClient.put<Task>(`${this.BASE_PATH}/${id}`, updates);
      if (!response.data) {
        throw new Error('No data returned from update task');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error('Failed to update task');
    }
  }

  static async deleteTask(id: number): Promise<void> {
    try {
      await httpClient.delete(`${this.BASE_PATH}/${id}`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error('Failed to delete task');
    }
  }

  static async toggleTask(id: number, isComplete: boolean): Promise<Task> {
    try {
      const updates: Partial<Task> = { 
        is_complete: isComplete,
        completed_at: isComplete ? new Date().toISOString() : undefined
      };
      
      return this.updateTask(id, updates);
    } catch (error) {
      console.error('Failed to toggle task:', error);
      throw new Error('Failed to toggle task');
    }
  }

  // Template management
  static async getTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      const response = await httpClient.get<TaskTemplate[]>(`${this.BASE_PATH}/templates`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch task templates:', error);
      throw new Error('Failed to fetch task templates');
    }
  }

  static async getActiveTemplates(): Promise<TaskTemplate[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await httpClient.get<TaskTemplate[]>(
        `${this.BASE_PATH}/templates?active=true&date=${today}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active templates:', error);
      throw new Error('Failed to fetch active templates');
    }
  }

  static async getTasksByPriority(priority: 0 | 1 | 2): Promise<Task[]> {
    try {
      const response = await httpClient.get<Task[]>(
        `${this.BASE_PATH}?is_template=false&priority=${priority}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks by priority:', error);
      throw new Error('Failed to fetch tasks by priority');
    }
  }

  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await httpClient.get<Task[]>(
        `${this.BASE_PATH}?is_template=false&is_complete=false&overdue=true&date=${today}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch overdue tasks:', error);
      throw new Error('Failed to fetch overdue tasks');
    }
  }

  static async deleteAllInstancesForTemplate(templateId: number): Promise<void> {
    try {
      await httpClient.delete(`${this.BASE_PATH}/templates/${templateId}/instances`);
    } catch (error) {
      console.error('Failed to delete template instances:', error);
      throw new Error('Failed to delete template instances');
    }
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