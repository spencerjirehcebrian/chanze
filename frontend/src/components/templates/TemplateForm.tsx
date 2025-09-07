import { useState } from 'react';
import { X, Calendar, Repeat, Tag, FileText, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CreateTaskRequest, TaskTemplate } from '../../types/database';

interface TemplateFormProps {
  template?: TaskTemplate | null;
  onSubmit?: (data: CreateTaskRequest) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

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

const QUICK_PATTERNS = [
  { id: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { id: 'weekends', label: 'Weekends', days: [0, 6] },
  { id: 'daily', label: 'Every Day', days: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'custom', label: 'Custom', days: [] },
];

export function TemplateForm({ template, onSubmit, onClose, loading = false }: TemplateFormProps) {
  const isEditing = !!template;
  
  // Form state
  const [task, setTask] = useState(template?.task || '');
  const [startDate, setStartDate] = useState(template?.due_date || '');
  const [endDate, setEndDate] = useState(template?.repeat_until || '');
  const [priority, setPriority] = useState<0 | 1 | 2>(template?.priority || 0);
  const [notes, setNotes] = useState(template?.notes || '');
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>(template?.repeat_days || []);
  const [selectedPattern, setSelectedPattern] = useState<string>('custom');
  const [error, setError] = useState('');

  // Initialize pattern selection
  useState(() => {
    if (template?.repeat_days) {
      const days = [...template.repeat_days].sort();
      const pattern = QUICK_PATTERNS.find(p => 
        p.days.length === days.length && p.days.every((day, i) => day === days[i])
      );
      if (pattern) {
        setSelectedPattern(pattern.id);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.trim()) {
      setError('Template name is required');
      return;
    }

    if (repeatDays.length === 0) {
      setError('Please select at least one day for the recurring pattern');
      return;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setError('');
      
      const templateData: CreateTaskRequest = {
        task: task.trim(),
        user_id: '', // This will be set by the service layer
        due_date: startDate || undefined,
        priority,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        is_repeating: true, // Templates are always repeating
        repeat_days: repeatDays,
        repeat_until: endDate || undefined,
      };

      await onSubmit?.(templateData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
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
      setRepeatDays([...repeatDays, dayId].sort());
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Template Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Daily standup meeting"
              disabled={loading}
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date (optional)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                When should this template start generating tasks?
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date (optional)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                min={startDate || undefined}
              />
              <p className="text-xs text-muted-foreground">
                When should this template stop generating tasks?
              </p>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as 0 | 1 | 2)}
              disabled={loading}
              className="w-full p-2 border rounded-md bg-background"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Repeat Pattern */}
          <div className="space-y-4">
            <label className="text-sm font-medium flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Repeat Pattern
            </label>
            
            {/* Quick patterns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_PATTERNS.map(pattern => (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => handlePatternChange(pattern.id)}
                  className={`p-3 text-sm rounded-lg border-2 transition-all ${
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

            {/* Individual day selection */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select specific days:</p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleRepeatDayToggle(day.id)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${
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

            {/* Pattern preview */}
            {repeatDays.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Pattern:</strong> Repeats on{' '}
                  {repeatDays.map(dayId => DAYS_OF_WEEK[dayId].name).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex gap-2">
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
                variant="outline"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this template..."
              disabled={loading}
              rows={3}
              className="w-full p-2 border rounded-md bg-background resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}