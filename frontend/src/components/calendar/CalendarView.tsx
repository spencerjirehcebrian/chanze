import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDay } from './CalendarDay';
import { CalendarHeader } from './CalendarHeader';
import { TaskItem } from '../task/TaskItem';
import { useTaskCalendar } from '../../hooks/useTasks';
import { TaskScheduleService } from '../../services';
import type { Task } from '../../types/database';
import type { DeletionType } from '../../services';

interface CalendarViewProps {
  onTaskToggle: (id: number, isComplete: boolean) => Promise<void>;
  onTaskDelete: (id: number, deleteType?: DeletionType) => Promise<void>;
  onAddTask?: (date?: Date) => void;
  className?: string;
}

type ViewMode = 'month' | 'week' | 'list';

export function CalendarView({ onTaskToggle, onTaskDelete, onAddTask, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks = [], isLoading, error } = useTaskCalendar(currentDate, viewMode === 'week' ? 'week' : 'month');

  // Navigation handlers
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range for current view
  const dateRange = TaskScheduleService.getDateRange(currentDate, viewMode === 'week' ? 'week' : 'month');

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const dateKey = task.due_date || task.inserted_at.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Generate calendar grid for month view
  const generateCalendarDays = () => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const days = [];

    // Add days to fill complete weeks
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(endDate);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

    const current = new Date(startOfWeek);
    while (current <= endOfWeek) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Generate week view days
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(dateRange.start);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(selectedDate?.toDateString() === date.toDateString() ? null : date);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };


  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load calendar: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onNavigateToday={navigateToday}
        onAddTask={() => onAddTask?.(selectedDate || new Date())}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Main Calendar Content */}
      <div className="space-y-4">
        {viewMode === 'list' ? (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle>
                Tasks for {formatMonthYear(currentDate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found for this period
                </div>
              ) : (
                tasks
                  .sort((a, b) => {
                    const dateA = new Date(a.due_date || a.inserted_at);
                    const dateB = new Date(b.due_date || b.inserted_at);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onTaskToggle}
                      onDelete={onTaskDelete}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        ) : (
          /* Calendar Grid View */
          <Card>
            <CardContent className="p-0">
              {/* Week days header */}
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center font-medium text-muted-foreground border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {viewMode === 'month' ? (
                <div className="grid grid-cols-7">
                  {generateCalendarDays().map((date, index) => (
                    <CalendarDay
                      key={date.toISOString()}
                      date={date}
                      tasks={tasksByDate[date.toISOString().split('T')[0]] || []}
                      isCurrentMonth={date.getMonth() === currentDate.getMonth()}
                      isToday={date.toDateString() === new Date().toDateString()}
                      isSelected={selectedDate?.toDateString() === date.toDateString()}
                      onClick={() => handleDateClick(date)}
                      onTaskToggle={onTaskToggle}
                      onTaskDelete={onTaskDelete}
                      onAddTask={() => onAddTask?.(date)}
                      className={`${index % 7 !== 6 ? 'border-r' : ''} border-b`}
                    />
                  ))}
                </div>
              ) : (
                /* Week View */
                <div className="grid grid-cols-7">
                  {generateWeekDays().map((date, index) => (
                    <CalendarDay
                      key={date.toISOString()}
                      date={date}
                      tasks={tasksByDate[date.toISOString().split('T')[0]] || []}
                      isCurrentMonth={true}
                      isToday={date.toDateString() === new Date().toDateString()}
                      isSelected={selectedDate?.toDateString() === date.toDateString()}
                      onClick={() => handleDateClick(date)}
                      onTaskToggle={onTaskToggle}
                      onTaskDelete={onTaskDelete}
                      onAddTask={() => onAddTask?.(date)}
                      className={`${index % 7 !== 6 ? 'border-r' : ''} h-32 sm:h-40`}
                      variant="week"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Date Details */}
        {selectedDate && viewMode !== 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAddTask?.(selectedDate)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasksByDate[selectedDate.toISOString().split('T')[0]] || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No tasks scheduled for this day
                </p>
              ) : (
                tasksByDate[selectedDate.toISOString().split('T')[0]].map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onTaskToggle}
                    onDelete={onTaskDelete}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}