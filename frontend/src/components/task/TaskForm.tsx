import { useState } from 'react';
import { AlertCircle, Plus, Calendar, Repeat, Tag, FileText, File } from 'lucide-react';
import { Button, Input, Switch, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { CreateTaskRequest } from '../../types/database';

interface TaskFormProps {
  onSubmit: (data: CreateTaskRequest) => Promise<void>;
  onSubmitTemplate?: (data: CreateTaskRequest) => Promise<void>;
  loading?: boolean;
  expanded?: boolean;
  defaultDate?: Date;
}

const QUICK_PATTERNS = [
  { id: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { id: 'weekends', label: 'Weekends', days: [0, 6] },
  { id: 'daily', label: 'Every Day', days: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'custom', label: 'Custom', days: [] },
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', name: 'Sunday' },
  { id: 1, label: 'Mon', name: 'Monday' },
  { id: 2, label: 'Tue', name: 'Tuesday' },
  { id: 3, label: 'Wed', name: 'Wednesday' },
  { id: 4, label: 'Thu', name: 'Thursday' },
  { id: 5, label: 'Fri', name: 'Friday' },
  { id: 6, label: 'Sat', name: 'Saturday' },
];

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Low', color: 'text-gray-500' },
  { value: 1, label: 'Medium', color: 'text-yellow-500' },
  { value: 2, label: 'High', color: 'text-red-500' },
] as const;

export function TaskForm({ onSubmit, onSubmitTemplate, loading = false, expanded = false, defaultDate }: TaskFormProps) {
  // Form mode
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  
  // Basic fields
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(
    defaultDate ? defaultDate.toISOString().split('T')[0] : ''
  );
  const [priority, setPriority] = useState<0 | 1 | 2>(0);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Repeat fields
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatUntil, setRepeatUntil] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<string>('custom');

  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(expanded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.trim()) {
      setError('Task is required');
      return;
    }

    if ((isRepeating || isTemplateMode) && repeatDays.length === 0) {
      setError('Please select at least one day for repeating tasks or templates');
      return;
    }

    if (isTemplateMode && !onSubmitTemplate) {
      setError('Template creation not supported in this context');
      return;
    }

    try {
      setError('');
      
      const taskData: CreateTaskRequest = {
        task: task.trim(),
        user_id: '', // This will be set by the service layer
        due_date: dueDate || undefined,
        priority,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        is_repeating: isRepeating || isTemplateMode,
        repeat_days: (isRepeating || isTemplateMode) ? repeatDays : undefined,
        repeat_until: (isRepeating || isTemplateMode) && repeatUntil ? repeatUntil : undefined,
      };

      if (isTemplateMode) {
        await onSubmitTemplate!(taskData);
      } else {
        await onSubmit(taskData);
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  const resetForm = () => {
    setTask('');
    setDueDate(defaultDate ? defaultDate.toISOString().split('T')[0] : '');
    setPriority(0);
    setNotes('');
    setTags([]);
    setTagInput('');
    setIsRepeating(false);
    setRepeatDays([]);
    setRepeatUntil('');
    setSelectedPattern('custom');
    setShowAdvanced(expanded);
    setIsTemplateMode(false);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePatternChange = (patternId: string) => {
    setSelectedPattern(patternId);
    const pattern = QUICK_PATTERNS.find(p => p.id === patternId);
    if (pattern && pattern.id !== 'custom') {
      setRepeatDays([...pattern.days]);
    }
  };

  const handleRepeatDayToggle = (dayId: number) => {
    setSelectedPattern('custom');
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter(id => id !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId].sort((a, b) => a - b));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {isTemplateMode ? 'Create Task Template' : 'Add New Task'}
          </span>
          <div className="flex items-center gap-2">
            {onSubmitTemplate && (
              <Button
                type="button"
                variant={isTemplateMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTemplateMode(!isTemplateMode)}
              >
                <File className="w-4 h-4 mr-1" />
                {isTemplateMode ? 'Template' : 'Template'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Task Title */}
          <div className="flex gap-2">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!task.trim() || loading}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {showAdvanced && (
            <>
              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) as 0 | 1 | 2)}
                    disabled={loading}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || loading}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Repeating */}
              {!isTemplateMode && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Repeat className="w-4 h-4" />
                    <Switch
                      checked={isRepeating}
                      onCheckedChange={setIsRepeating}
                      disabled={loading}
                    />
                    Repeating Task
                  </label>
                  
                  {isRepeating && (
                    <div className="mt-2 space-y-3">
                      {/* Quick patterns */}
                      <div>
                        <label className="text-sm font-medium">Quick patterns:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                          {QUICK_PATTERNS.map(pattern => (
                            <button
                              key={pattern.id}
                              type="button"
                              onClick={() => handlePatternChange(pattern.id)}
                              className={`p-2 text-xs rounded-lg border transition-all ${
                                selectedPattern === pattern.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                                  : 'border-muted hover:border-blue-300'
                              }`}
                              disabled={loading}
                            >
                              {pattern.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Individual day selection */}
                      <div>
                        <label className="text-sm font-medium">Custom days:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => handleRepeatDayToggle(day.id)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                repeatDays.includes(day.id)
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-background border-border hover:border-blue-300'
                              }`}
                              disabled={loading}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Repeat until (optional):</label>
                        <Input
                          type="date"
                          value={repeatUntil}
                          onChange={(e) => setRepeatUntil(e.target.value)}
                          disabled={loading}
                          className="mt-1 max-w-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template mode - always shows repeat pattern */}
              {isTemplateMode && (
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <File className="w-4 h-4" />
                    Template Repeat Pattern
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Templates automatically create recurring tasks based on this pattern.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Quick patterns */}
                    <div>
                      <label className="text-sm font-medium">Quick patterns:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                        {QUICK_PATTERNS.map(pattern => (
                          <button
                            key={pattern.id}
                            type="button"
                            onClick={() => handlePatternChange(pattern.id)}
                            className={`p-2 text-xs rounded-lg border transition-all ${
                              selectedPattern === pattern.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                                : 'border-muted hover:border-blue-300'
                            }`}
                            disabled={loading}
                          >
                            {pattern.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Individual day selection */}
                    <div>
                      <label className="text-sm font-medium">Custom days:</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleRepeatDayToggle(day.id)}
                            className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                              repeatDays.includes(day.id)
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-background border-border hover:border-blue-300'
                            }`}
                            disabled={loading}
                          >
                            {day.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Template end date (optional):</label>
                      <Input
                        type="date"
                        value={repeatUntil}
                        onChange={(e) => setRepeatUntil(e.target.value)}
                        disabled={loading}
                        className="mt-1 max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty for indefinite template
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  disabled={loading}
                  rows={3}
                  className="w-full mt-1 p-2 border rounded-md bg-background resize-none"
                />
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Legacy compatibility export
export { TaskForm as TodoForm };