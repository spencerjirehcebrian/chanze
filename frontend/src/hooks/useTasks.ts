import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService, TaskScheduleService, type DeletionType } from '../services';
import type { Task, CreateTaskRequest } from '../types/database';

const TASKS_QUERY_KEY = ['tasks'] as const;

export function useTasks() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: TaskService.getAllTasks,
    staleTime: 30 * 1000, // 30 seconds
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: CreateTaskRequest) => TaskService.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to create task: ${error.message}`);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: number; 
      updates: Partial<Task>
    }) => TaskService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: ({ id, deleteType }: { id: number; deleteType?: DeletionType }) => 
      deleteType 
        ? TaskScheduleService.deleteTaskWithOptions(id, deleteType)
        : TaskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to delete task: ${error.message}`);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, isComplete }: { id: number; isComplete: boolean }) =>
      TaskService.toggleTask(id, isComplete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to toggle task: ${error.message}`);
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    toggleTask: toggleTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isToggling: toggleTaskMutation.isPending,
  };
}

export function useTaskTemplates() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['task-templates'],
    queryFn: TaskService.getTaskTemplates,
    staleTime: 60 * 1000, // 1 minute
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: CreateTaskRequest) => TaskService.createTaskTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to create task template: ${error.message}`);
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
  };
}

export function useTaskCalendar(currentDate: Date, viewType: 'week' | 'month') {
  const dateRange = TaskScheduleService.getDateRange(currentDate, viewType);
  
  return useQuery({
    queryKey: ['tasks-calendar', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => TaskScheduleService.getTasksForDateRange(dateRange.start, dateRange.end),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTasksByFilter(filter: {
  priority?: 0 | 1 | 2;
  overdue?: boolean;
  completed?: boolean;
}) {
  return useQuery({
    queryKey: ['tasks-filtered', filter],
    queryFn: async () => {
      if (filter.overdue) {
        return TaskService.getOverdueTasks();
      }
      
      if (filter.priority !== undefined) {
        return TaskService.getTasksByPriority(filter.priority);
      }
      
      // Default to all tasks with additional filtering
      const allTasks = await TaskService.getAllTasks();
      
      return allTasks.filter(task => {
        if (filter.completed !== undefined && task.is_complete !== filter.completed) {
          return false;
        }
        return true;
      });
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Legacy compatibility hook
export function useTodos() {
  const result = useTasks();
  
  return {
    todos: result.tasks,
    isLoading: result.isLoading,
    error: result.error,
    createTodo: result.createTask,
    updateTodo: result.updateTask,
    deleteTodo: result.deleteTask,
    toggleTodo: result.toggleTask,
    isCreating: result.isCreating,
    isUpdating: result.isUpdating,
    isDeleting: result.isDeleting,
    isToggling: result.isToggling,
  };
}