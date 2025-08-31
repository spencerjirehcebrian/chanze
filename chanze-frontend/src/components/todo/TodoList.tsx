import { ClipboardList } from 'lucide-react';
import { TodoItem } from './TodoItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
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
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium mb-2">No todos yet!</p>
          <p className="text-muted-foreground">Add your first task above to get started</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = todos.filter(todo => todo.is_complete).length;
  const remainingCount = todos.length - completedCount;
  const progressValue = (completedCount / todos.length) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
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
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">
              {remainingCount} of {todos.length} tasks remaining
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-xs text-muted-foreground">
                {Math.round(progressValue)}% complete
              </span>
            </div>
          </div>
          <Progress value={progressValue} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}