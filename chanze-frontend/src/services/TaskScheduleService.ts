import { TaskService } from './TaskService';
import type { Task, TaskTemplate } from '../types/database';

export type DeletionType = 'this' | 'future' | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

export class TaskScheduleService {
  /**
   * Get tasks for a specific date range, generating missing instances on-demand
   */
  static async getTasksForDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    // 1. Get existing task instances in the date range
    const existingTasks = await TaskService.getTasksForDateRange(startDate, endDate);
    
    // 2. Get active templates that could generate tasks in this range
    const activeTemplates = await TaskService.getActiveTemplates();
    
    // 3. Calculate which task instances are missing
    const missingInstances = await this.calculateMissingInstances(
      activeTemplates, 
      existingTasks, 
      startDate, 
      endDate
    );
    
    // 4. Create missing instances on-the-fly
    const newInstances: Task[] = [];
    for (const { templateId, dueDate } of missingInstances) {
      try {
        const instance = await TaskService.createTaskInstance(templateId, dueDate);
        newInstances.push(instance);
      } catch (error) {
        console.warn(`Failed to create task instance for template ${templateId} on ${dueDate}:`, error);
      }
    }
    
    // 5. Return combined results sorted by due date
    const allTasks = [...existingTasks, ...newInstances];
    return allTasks.sort((a, b) => {
      const dateA = new Date(a.due_date || a.inserted_at);
      const dateB = new Date(b.due_date || b.inserted_at);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Calculate which task instances are missing for the given templates and date range
   */
  private static async calculateMissingInstances(
    templates: TaskTemplate[],
    existingTasks: Task[],
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ templateId: number; dueDate: string }>> {
    const missingInstances: Array<{ templateId: number; dueDate: string }> = [];

    for (const template of templates) {
      if (!template.repeat_days?.length) continue;

      // Get all dates this template should have instances for
      const expectedDates = this.calculateExpectedDates(template, startDate, endDate);

      // Check which dates are missing instances
      for (const expectedDate of expectedDates) {
        const dateString = expectedDate.toISOString().split('T')[0];
        
        const hasExistingInstance = existingTasks.some(task => 
          task.template_id === template.id && 
          task.due_date === dateString
        );

        if (!hasExistingInstance) {
          missingInstances.push({
            templateId: template.id,
            dueDate: dateString
          });
        }
      }
    }

    return missingInstances;
  }

  /**
   * Calculate all dates a template should have instances for in the given range
   */
  private static calculateExpectedDates(
    template: TaskTemplate,
    startDate: Date,
    endDate: Date
  ): Date[] {
    const expectedDates: Date[] = [];
    const templateStartDate = new Date(template.due_date || template.inserted_at);
    const templateEndDate = template.repeat_until ? new Date(template.repeat_until) : null;

    // Start from the later of template start date or range start date
    const searchStartDate = new Date(Math.max(templateStartDate.getTime(), startDate.getTime()));
    
    // End at the earlier of template end date or range end date
    const searchEndDate = new Date(Math.min(
      templateEndDate?.getTime() || endDate.getTime(),
      endDate.getTime()
    ));

    const currentDate = new Date(searchStartDate);
    
    while (currentDate <= searchEndDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (template.repeat_days?.includes(dayOfWeek)) {
        expectedDates.push(new Date(currentDate));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return expectedDates;
  }

  /**
   * Complete a task and handle repeating task logic
   */
  static async completeTask(taskId: number): Promise<void> {
    await TaskService.toggleTask(taskId, true);
    // Note: Next occurrence will be generated when user views future dates
    // No need to generate immediately for on-demand approach
  }

  /**
   * Smart deletion with user choice for repeating tasks
   */
  static async deleteTaskWithOptions(taskId: number, deleteType: DeletionType): Promise<void> {
    const task = await TaskService.getTask(taskId);
    if (!task) throw new Error('Task not found');

    switch (deleteType) {
      case 'this':
        // Just delete this instance
        await TaskService.deleteTask(taskId);
        break;
        
      case 'future':
        // Delete this instance and prevent future occurrences
        await TaskService.deleteTask(taskId);
        if (task.template_id) {
          // Set the template to end before this task's due date
          const endDate = task.due_date || new Date().toISOString().split('T')[0];
          const previousDay = new Date(endDate);
          previousDay.setDate(previousDay.getDate() - 1);
          
          await TaskService.updateTask(task.template_id, {
            repeat_until: previousDay.toISOString().split('T')[0]
          });
        }
        break;
        
      case 'all':
        // Delete entire series
        if (task.template_id) {
          // Mark template as inactive and delete all instances
          await TaskService.updateTask(task.template_id, { 
            is_repeating: false,
            repeat_until: new Date().toISOString().split('T')[0] 
          });
          await TaskService.deleteAllInstancesForTemplate(task.template_id);
        } else if (task.is_template) {
          // This is the template itself
          await TaskService.updateTask(taskId, { 
            is_repeating: false,
            repeat_until: new Date().toISOString().split('T')[0] 
          });
          await TaskService.deleteAllInstancesForTemplate(taskId);
        }
        break;
    }
  }

  /**
   * Get date range for calendar views
   */
  static getDateRange(currentDate: Date, viewType: 'week' | 'month'): DateRange {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewType === 'week') {
      // Get start of week (Sunday)
      start.setDate(start.getDate() - start.getDay());
      // Get end of week (Saturday)
      end.setDate(start.getDate() + 6);
    } else {
      // Get start of month
      start.setDate(1);
      // Get end of month
      end.setMonth(end.getMonth() + 1, 0);
    }

    return { start, end };
  }

  /**
   * Check if a template should generate a task on a specific date
   */
  static isTaskDueOnDate(template: TaskTemplate, date: Date): boolean {
    if (!template.is_repeating || !template.repeat_days?.length) return false;

    const dayOfWeek = date.getDay();
    const templateStartDate = new Date(template.due_date || template.inserted_at);
    const templateEndDate = template.repeat_until ? new Date(template.repeat_until) : null;

    const isInPattern = template.repeat_days.includes(dayOfWeek);
    const isAfterStart = date >= templateStartDate;
    const isBeforeEnd = !templateEndDate || date <= templateEndDate;

    return isInPattern && isAfterStart && isBeforeEnd;
  }

  /**
   * Calculate next occurrence date for a repeating task
   */
  static getNextOccurrence(template: TaskTemplate, fromDate: Date = new Date()): Date | null {
    if (!template.is_repeating || !template.repeat_days?.length) return null;

    const searchDate = new Date(fromDate);
    searchDate.setDate(searchDate.getDate() + 1); // Start from tomorrow

    const maxDaysToSearch = 14; // Prevent infinite loops
    let daysSearched = 0;

    while (daysSearched < maxDaysToSearch) {
      if (this.isTaskDueOnDate(template, searchDate)) {
        return new Date(searchDate);
      }
      
      searchDate.setDate(searchDate.getDate() + 1);
      daysSearched++;
    }

    return null;
  }
}