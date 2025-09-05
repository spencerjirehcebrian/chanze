import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CalendarView } from '../components/calendar';
import { TaskForm } from '../components/task/TaskForm';
import { useTasks, useTaskTemplates } from '../hooks/useTasks';
import type { CreateTaskRequest } from '../types/database';
import type { DeletionType } from '../services';

export function CalendarPage() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { toggleTask, deleteTask } = useTasks();
  const { createTemplate } = useTaskTemplates();

  const handleTaskToggle = async (id: number, isComplete: boolean) => {
    await toggleTask({ id, isComplete });
  };

  const handleTaskDelete = async (id: number, deleteType?: DeletionType) => {
    await deleteTask({ id, deleteType });
  };

  const handleAddTask = (date?: Date) => {
    setSelectedDate(date || null);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (data: CreateTaskRequest) => {
    // This would typically use the regular task creation
    console.log('Creating task:', data);
    setShowTaskForm(false);
  };

  const handleTemplateSubmit = async (data: CreateTaskRequest) => {
    await createTemplate(data);
    setShowTaskForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your tasks in a calendar layout
          </p>
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView
        onTaskToggle={handleTaskToggle}
        onTaskDelete={handleTaskDelete}
        onAddTask={handleAddTask}
      />

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  Add Task{selectedDate && ` for ${selectedDate.toLocaleDateString()}`}
                </h2>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
              <TaskForm
                onSubmit={handleTaskSubmit}
                onSubmitTemplate={handleTemplateSubmit}
                defaultDate={selectedDate || undefined}
                expanded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}