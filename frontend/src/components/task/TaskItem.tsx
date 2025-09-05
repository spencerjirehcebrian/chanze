import { X, Calendar, Repeat, Tag, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { TaskDeleteModal } from './TaskDeleteModal';
import type { Task } from '../../types/database';
import type { DeletionType } from '../../services';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, isComplete: boolean) => Promise<void>;
  onDelete: (id: number, deleteType?: DeletionType) => Promise<void>;
  disabled?: boolean;
}

const PRIORITY_CONFIG = {
  0: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null },
  1: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  2: { label: 'High', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
} as const;

export function TaskItem({ task, onToggle, onDelete, disabled = false }: TaskItemProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;
  
  // Check if task is overdue
  const isOverdue = task.due_date && !task.is_complete && new Date(task.due_date) < new Date();
  
  // Determine task type for visual indicators
  const isTemplate = task.is_template;
  const isInstance = !task.is_template && task.template_id !== null;
  const isRecurring = task.template_id !== null || (task.is_template && task.is_repeating);

  const handleToggle = async () => {
    if (!disabled && !isTemplate) { // Templates can't be completed
      await onToggle(task.id, !task.is_complete);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      if (isRecurring) {
        setShowDeleteModal(true);
      } else {
        onDelete(task.id);
      }
    }
  };

  const handleConfirmDelete = async (deleteType: DeletionType) => {
    await onDelete(task.id, deleteType);
    setShowDeleteModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <div 
        onClick={handleToggle}
        className={`group relative flex flex-col p-4 rounded-lg cursor-pointer fade-in transition-all duration-300 border-l-4 space-y-2 ${
          isTemplate 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : task.is_complete 
              ? 'border-muted-foreground/30 hover:border-muted-foreground/50' 
              : isOverdue
                ? 'border-red-500 hover:border-red-600'
                : 'border-primary hover:border-primary/80'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${isTemplate ? 'cursor-default' : ''}
        `}
      >
        {/* Main content row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Completion checkbox/status indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {isTemplate ? (
                <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Repeat className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
              ) : task.is_complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <div className={`w-5 h-5 rounded border-2 ${
                  isOverdue 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : 'border-muted-foreground/30 hover:border-primary/50'
                }`} />
              )}
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium transition-all duration-300 ${
                  task.is_complete
                    ? 'text-muted-foreground opacity-60 line-through'
                    : isTemplate
                      ? 'text-blue-700 dark:text-blue-300'
                      : isOverdue
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-foreground'
                }`}>
                  {task.task}
                </span>

                {/* Task type indicators */}
                {isTemplate && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    Template
                  </span>
                )}
                {isInstance && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                    Recurring
                  </span>
                )}
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {/* Priority indicator */}
                {task.priority > 0 && PriorityIcon && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityConfig.bgColor}`}>
                    <PriorityIcon className={`w-3 h-3 ${priorityConfig.color}`} />
                    <span className={priorityConfig.color}>{priorityConfig.label}</span>
                  </div>
                )}

                {/* Due date */}
                {task.due_date && (
                  <div className={`flex items-center gap-1 ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(task.due_date)}</span>
                    {isOverdue && <span className="font-medium">(Overdue)</span>}
                  </div>
                )}

                {/* Completion date */}
                {task.completed_at && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Done {formatDate(task.completed_at.split('T')[0])}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive w-8 h-8 p-0 hover:scale-110 active:scale-95"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Notes preview */}
        {task.notes && (
          <div className="text-xs text-muted-foreground italic pl-8">
            {task.notes.length > 100 ? `${task.notes.substring(0, 100)}...` : task.notes}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <TaskDeleteModal
          task={task}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

// Legacy export for backward compatibility
export { TaskItem as TodoItem };