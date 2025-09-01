import { TodoItem } from './TodoItem';
import { Skeleton } from '@/components/ui/skeleton';
import type { Todo } from '../../types';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, isComplete: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function TodoList({ 
  todos, 
  onToggle, 
  onDelete, 
  loading = false, 
  disabled = false 
}: TodoListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tasks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          disabled={disabled}
        />
      ))}
    </div>
  );
}