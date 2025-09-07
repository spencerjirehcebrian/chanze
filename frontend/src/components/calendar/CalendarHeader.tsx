import { ChevronLeft, ChevronRight, Calendar, List, Grid3X3, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'list';
  onViewModeChange: (mode: 'month' | 'week' | 'list') => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onAddTask?: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  onAddTask,
  showFilters = false,
  onToggleFilters
}: CalendarHeaderProps) {
  const formatTitle = () => {
    if (viewMode === 'week') {
      // Get start and end of week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }
    
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigatePrevious}
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h2 className="text-xl font-semibold min-w-0 whitespace-nowrap">
              {formatTitle()}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateNext}
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToday}
          >
            Today
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border rounded-lg p-1 bg-muted">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('month')}
              className="h-7 px-2"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1 hidden sm:inline">Month</span>
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className="h-7 px-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1 hidden sm:inline">Week</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-7 px-2"
            >
              <List className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1 hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Filter toggle */}
          {onToggleFilters && (
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleFilters}
              className="h-8"
            >
              <Filter className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1 hidden sm:inline">Filters</span>
            </Button>
          )}

          {/* Add task */}
          {onAddTask && (
            <Button
              onClick={onAddTask}
              size="sm"
              className="h-8"
            >
              <Plus className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-1 hidden sm:inline">Add Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-blue-500 bg-blue-100 rounded-full"></div>
          <span>Templates</span>
        </div>
      </div>
    </div>
  );
}