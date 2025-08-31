import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TodoService } from '../services';
import type { Todo } from '../types';

const TODOS_QUERY_KEY = ['todos'] as const;

export function useTodos() {
  const queryClient = useQueryClient();

  const todosQuery = useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: TodoService.getAllTodos,
    staleTime: 30 * 1000, // 30 seconds
  });

  const createTodoMutation = useMutation({
    mutationFn: (todo: Omit<Todo, 'id' | 'inserted_at'>) =>
      TodoService.createTodo(todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to create todo: ${error.message}`);
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: number; 
      updates: Partial<Pick<Todo, 'task' | 'is_complete'>>
    }) =>
      TodoService.updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to update todo: ${error.message}`);
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => TodoService.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to delete todo: ${error.message}`);
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: ({ id, isComplete }: { id: number; isComplete: boolean }) =>
      TodoService.toggleTodo(id, isComplete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      throw new Error(`Failed to toggle todo: ${error.message}`);
    },
  });

  return {
    todos: todosQuery.data ?? [],
    isLoading: todosQuery.isLoading,
    error: todosQuery.error,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    toggleTodo: toggleTodoMutation.mutateAsync,
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
    isToggling: toggleTodoMutation.isPending,
  };
}