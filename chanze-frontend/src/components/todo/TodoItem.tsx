import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import type { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, isComplete: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  disabled?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, disabled = false }: TodoItemProps) {
  const handleToggle = (checked: boolean) => {
    if (!disabled) {
      onToggle(todo.id, !checked);
    }
  };

  const handleDelete = () => {
    if (!disabled) {
      onDelete(todo.id);
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={todo.is_complete}
          onCheckedChange={handleToggle}
          disabled={disabled}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <span
          className={`flex-1 transition-all duration-200 ${
            todo.is_complete
              ? 'text-muted-foreground line-through opacity-75'
              : 'text-foreground group-hover:text-primary'
          }`}
        >
          {todo.task}
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={disabled}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}