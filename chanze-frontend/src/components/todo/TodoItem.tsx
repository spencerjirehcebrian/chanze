import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, isComplete: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  disabled?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, disabled = false }: TodoItemProps) {
  const handleToggle = async () => {
    if (!disabled) {
      await onToggle(todo.id, !todo.is_complete);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering toggle when clicking delete
    if (!disabled) {
      await onDelete(todo.id);
    }
  };

  return (
    <div 
      onClick={handleToggle}
      className={`group relative flex items-center py-3 px-4 rounded-lg cursor-pointer fade-in transition-all duration-300 
        ${todo.is_complete 
          ? 'border-l-4 border-primary hover:border-primary/80' 
          : 'border-l-2 border-muted-foreground/30 hover:border-primary/50'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <span
        className={`flex-1 transition-all duration-300 select-none ${
          todo.is_complete
            ? 'text-muted-foreground opacity-40 line-through decoration-muted-foreground decoration-1 animate-strike-through'
            : 'text-foreground hover:text-foreground/90'
        }`}
      >
        {todo.task}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={disabled}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 text-muted-foreground hover:text-destructive w-8 h-8 p-0 hover:scale-110 active:scale-95 ml-2"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}