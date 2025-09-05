import { useState } from 'react';
import { 
  Calendar, 
  Repeat, 
  Tag, 
  AlertTriangle, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { TaskDeleteModal } from '../task/TaskDeleteModal';
import { TaskService, TaskScheduleService } from '../../services';
import type { TaskTemplate } from '../../types/database';
import type { DeletionType } from '../../services';

interface TemplateItemProps {
  template: TaskTemplate;
  onEdit: () => void;
}

const PRIORITY_CONFIG = {
  0: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null },
  1: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  2: { label: 'High', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
} as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TemplateItem({ template, onEdit }: TemplateItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[template.priority];
  const PriorityIcon = priorityConfig.icon;
  
  const isActive = template.is_repeating && (!template.repeat_until || new Date(template.repeat_until) >= new Date());
  const nextOccurrence = isActive ? TaskScheduleService.getNextOccurrence(template) : null;
  
  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await TaskService.updateTask(template.id, {
        is_repeating: !template.is_repeating
      });
      // Note: This would normally trigger a re-fetch through React Query
    } catch (error) {
      console.error('Failed to toggle template:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (deleteType: DeletionType) => {
    try {
      await TaskService.deleteTask(template.id);
      if (deleteType === 'all') {
        await TaskService.deleteAllInstancesForTemplate(template.id);
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const formatRepeatPattern = (repeatDays: number[]) => {
    if (!repeatDays || repeatDays.length === 0) return 'No pattern';
    
    const sortedDays = [...repeatDays].sort();
    
    // Check for common patterns
    if (sortedDays.length === 7) return 'Every day';
    if (sortedDays.join(',') === '1,2,3,4,5') return 'Weekdays';
    if (sortedDays.join(',') === '0,6') return 'Weekends';
    
    return sortedDays.map(day => DAY_NAMES[day]).join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Card className={`transition-all duration-200 ${
        isActive 
          ? 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20' 
          : 'border-muted bg-muted/20'
      }`}>
        <CardContent className="p-6">
          {/* Main template info */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Status indicator */}
              <div className="flex-shrink-0 mt-1">
                {isActive ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                ) : (
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                )}
              </div>

              {/* Template content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-semibold ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {template.task}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    Template
                  </span>
                  {!isActive && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {/* Repeat pattern */}
                  <div className="flex items-center gap-1">
                    <Repeat className="w-4 h-4" />
                    <span>{formatRepeatPattern(template.repeat_days || [])}</span>
                  </div>

                  {/* Priority */}
                  {template.priority > 0 && PriorityIcon && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityConfig.bgColor}`}>
                      <PriorityIcon className={`w-3 h-3 ${priorityConfig.color}`} />
                      <span className={`text-xs ${priorityConfig.color}`}>{priorityConfig.label}</span>
                    </div>
                  )}

                  {/* Next occurrence */}
                  {nextOccurrence && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Calendar className="w-4 h-4" />
                      <span>Next: {formatDate(nextOccurrence.toISOString())}</span>
                    </div>
                  )}

                  {/* End date */}
                  {template.repeat_until && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Until {formatDate(template.repeat_until)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Toggle active/inactive */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleActive}
                disabled={isToggling}
                className={`${
                  isActive 
                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20' 
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="sr-only">Deactivate</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="sr-only">Activate</span>
                  </>
                )}
              </Button>

              {/* Edit */}
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Settings className="w-4 h-4" />
                <span className="sr-only">Edit</span>
              </Button>

              {/* Delete */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete</span>
              </Button>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
              </Button>
            </div>
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {template.tags.map((tag, index) => (
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

          {/* Expanded details */}
          {isExpanded && (
            <div className="pt-4 border-t border-border space-y-3">
              {/* Notes */}
              {template.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{template.notes}</p>
                </div>
              )}

              {/* Detailed schedule info */}
              <div>
                <h4 className="text-sm font-medium mb-2">Schedule Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{formatDate(template.inserted_at)}</span>
                  </div>
                  {template.due_date && (
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="ml-2">{formatDate(template.due_date)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`ml-2 font-medium ${
                      isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {template.repeat_until && (
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <span className="ml-2">{formatDate(template.repeat_until)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Repeat pattern visualization */}
              {template.repeat_days && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Repeat Pattern</h4>
                  <div className="flex gap-1">
                    {DAY_NAMES.map((day, index) => (
                      <div
                        key={day}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                          template.repeat_days?.includes(index)
                            ? 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'border-muted-foreground/20 text-muted-foreground/50'
                        }`}
                      >
                        {day.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <TaskDeleteModal
          task={template}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}