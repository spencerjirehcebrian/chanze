import { AlertTriangle, Calendar, Repeat } from 'lucide-react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Task } from '../../types/database';
import type { DeletionType } from '../../services';

interface TaskDeleteModalProps {
  task: Task;
  onConfirm: (deleteType: DeletionType) => Promise<void>;
  onCancel: () => void;
}

export function TaskDeleteModal({ task, onConfirm, onCancel }: TaskDeleteModalProps) {
  const isTemplate = task.is_template;
  const isInstance = !task.is_template && task.template_id !== null;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDeleteOptions = () => {
    if (isTemplate) {
      return [
        {
          type: 'all' as DeletionType,
          title: 'Delete Template & All Instances',
          description: 'This will delete the template and all future and past instances of this recurring task.',
          destructive: true,
          icon: AlertTriangle
        }
      ];
    }

    if (isInstance) {
      return [
        {
          type: 'this' as DeletionType,
          title: 'Delete This Instance Only',
          description: `Only delete this occurrence on ${task.due_date ? formatDate(task.due_date) : 'this date'}. Future occurrences will continue as scheduled.`,
          destructive: false,
          icon: Calendar
        },
        {
          type: 'future' as DeletionType,
          title: 'Delete This & Future Instances',
          description: 'Delete this occurrence and stop the recurring pattern from this date forward.',
          destructive: true,
          icon: Repeat
        },
        {
          type: 'all' as DeletionType,
          title: 'Delete Entire Series',
          description: 'Delete the template and all instances of this recurring task (past and future).',
          destructive: true,
          icon: AlertTriangle
        }
      ];
    }

    // Should not reach here for recurring tasks
    return [];
  };

  const deleteOptions = getDeleteOptions();

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Delete Recurring Task
          </DialogTitle>
          <DialogDescription>
            This is a {isTemplate ? 'template' : 'recurring'} task. How would you like to delete it?
          </DialogDescription>
        </DialogHeader>

        {/* Task preview */}
        <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">{task.task}</span>
          </div>
          {task.due_date && !isTemplate && (
            <p className="text-xs text-muted-foreground">
              Due: {formatDate(task.due_date)}
            </p>
          )}
          {isTemplate && task.repeat_days && (
            <p className="text-xs text-muted-foreground">
              Repeats: {task.repeat_days.map(day => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return days[day];
              }).join(', ')}
            </p>
          )}
        </div>

        {/* Delete options */}
        <div className="space-y-2">
          {deleteOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => onConfirm(option.type)}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all hover:scale-[1.02] ${
                  option.destructive 
                    ? 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-950/40'
                    : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-950/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <IconComponent className={`w-5 h-5 mt-0.5 ${
                    option.destructive 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <h4 className={`font-medium text-sm ${
                      option.destructive 
                        ? 'text-red-900 dark:text-red-100' 
                        : 'text-blue-900 dark:text-blue-100'
                    }`}>
                      {option.title}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      option.destructive 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cancel button */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}