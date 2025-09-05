import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '../../types/database';

interface TodoListProps {
  todos: Task[];
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
      {todos.map((task) => (
        <div key={task.id} className="flex items-center gap-3 py-3 px-4 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors">
          <input
            type="checkbox"
            checked={task.is_complete}
            onChange={() => onToggle(task.id, !task.is_complete)}
            disabled={disabled}
            className="rounded border-border"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${task.is_complete ? 'line-through text-muted-foreground' : ''}`}>
              {task.task}
            </p>
            {task.due_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => onDelete(task.id)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive transition-colors text-sm"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}