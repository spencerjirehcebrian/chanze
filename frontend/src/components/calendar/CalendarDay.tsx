import { Plus, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Task } from '../../types/database';
import type { DeletionType } from '../../services';

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onTaskToggle: (id: number, isComplete: boolean) => Promise<void>;
  onTaskDelete?: (id: number, deleteType?: DeletionType) => Promise<void>;
  onAddTask?: () => void;
  className?: string;
  variant?: 'month' | 'week';
}

export function CalendarDay({ 
  date, 
  tasks, 
  isCurrentMonth, 
  isToday, 
  isSelected,
  onClick,
  onTaskToggle,
  onAddTask,
  className = '',
  variant = 'month'
}: CalendarDayProps) {
  const dayNumber = date.getDate();
  const tasksToShow = variant === 'week' ? tasks.slice(0, 6) : tasks.slice(0, 3);
  const hasMoreTasks = tasks.length > tasksToShow.length;
  
  // Task statistics
  const completedTasks = tasks.filter(task => task.is_complete && !task.is_template).length;
  const incompleteTasks = tasks.filter(task => !task.is_complete && !task.is_template).length;
  const overdueTasks = tasks.filter(task => 
    !task.is_complete && 
    !task.is_template && 
    task.due_date && 
    new Date(task.due_date) < new Date()
  ).length;

  const getDayClasses = () => {
    let classes = `p-2 cursor-pointer transition-all duration-200 hover:bg-muted/50 min-h-[6rem] ${className}`;
    
    if (!isCurrentMonth) {
      classes += ' text-muted-foreground/50 bg-muted/20';
    }
    
    if (isToday) {
      classes += ' bg-blue-50 dark:bg-blue-950/20';
    }
    
    if (isSelected) {
      classes += ' ring-2 ring-blue-500 ring-inset bg-blue-50/80 dark:bg-blue-950/40';
    }
    
    return classes;
  };

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!task.is_template) {
      onTaskToggle(task.id, !task.is_complete);
    }
  };

  const getTaskClasses = (task: Task) => {
    let classes = 'text-xs p-1.5 rounded mb-1 flex items-center gap-1.5 transition-all hover:shadow-sm cursor-pointer group';
    
    if (task.is_template) {
      classes += ' bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
    } else if (task.is_complete) {
      classes += ' bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 line-through opacity-60';
    } else if (task.due_date && new Date(task.due_date) < new Date()) {
      classes += ' bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800';
    } else {
      classes += ' bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
    }
    
    return classes;
  };

  return (
    <div className={getDayClasses()} onClick={onClick}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${
          isToday 
            ? 'text-blue-700 dark:text-blue-300 font-bold' 
            : isCurrentMonth 
              ? 'text-foreground' 
              : 'text-muted-foreground'
        }`}>
          {dayNumber}
        </span>
        
        {/* Task indicators */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-1">
            {overdueTasks > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full" title={`${overdueTasks} overdue`} />
            )}
            {incompleteTasks > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${incompleteTasks} pending`} />
            )}
            {completedTasks > 0 && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title={`${completedTasks} completed`} />
            )}
          </div>
        )}
      </div>

      {/* Tasks list */}
      <div className="space-y-1 flex-1">
        {tasksToShow.map((task) => (
          <div
            key={task.id}
            className={getTaskClasses(task)}
            onClick={(e) => handleTaskClick(e, task)}
            title={task.task}
          >
            {/* Task status icon */}
            <div className="flex-shrink-0">
              {task.is_template ? (
                <div className="w-3 h-3 rounded border border-blue-500 bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-300 rounded-full" />
                </div>
              ) : task.is_complete ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
            </div>

            {/* Task text */}
            <span className="flex-1 truncate text-xs">
              {task.task}
            </span>

            {/* Priority indicator */}
            {task.priority === 2 && !task.is_complete && (
              <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
          </div>
        ))}

        {/* More tasks indicator */}
        {hasMoreTasks && (
          <div className="text-xs text-muted-foreground p-1 text-center">
            +{tasks.length - tasksToShow.length} more
          </div>
        )}
      </div>

      {/* Add task button (shows on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddTask?.();
          }}
          className="w-full h-6 text-xs py-0 px-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}