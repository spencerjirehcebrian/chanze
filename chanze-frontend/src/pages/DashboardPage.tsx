import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Repeat, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskItem } from '../components/task/TaskItem';
import { TaskForm } from '../components/task/TaskForm';
import { useTasks, useTaskTemplates, useTasksByFilter } from '../hooks/useTasks';
import type { CreateTaskRequest } from '../types/database';
import type { DeletionType } from '../services';

export function DashboardPage() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  const { tasks, toggleTask, deleteTask, createTask } = useTasks();
  const { templates, createTemplate } = useTaskTemplates();
  const { data: overdueTasks = [] } = useTasksByFilter({ overdue: true });

  // Calculate stats
  const totalTasks = tasks.filter(task => !task.is_template).length;
  const completedTasks = tasks.filter(task => task.is_complete && !task.is_template).length;
  const pendingTasks = totalTasks - completedTasks;
  const activeTemplates = templates.filter(template => 
    template.is_repeating && (!template.repeat_until || new Date(template.repeat_until) >= new Date())
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get recent tasks (last 5 incomplete tasks)
  const recentTasks = tasks
    .filter(task => !task.is_complete && !task.is_template)
    .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
    .slice(0, 5);

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(task => 
    !task.is_template && 
    task.due_date === today
  );

  const handleTaskToggle = async (id: number, isComplete: boolean) => {
    await toggleTask({ id, isComplete });
  };

  const handleTaskDelete = async (id: number, deleteType?: DeletionType) => {
    await deleteTask({ id, deleteType });
  };

  const handleTaskSubmit = async (data: CreateTaskRequest) => {
    await createTask(data);
    setShowTaskForm(false);
  };

  const handleTemplateSubmit = async (data: CreateTaskRequest) => {
    await createTemplate(data);
    setShowTaskForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your tasks and productivity
          </p>
        </div>
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-blue-600">{pendingTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-3xl font-bold text-purple-600">{activeTemplates}</p>
              </div>
              <Repeat className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tasks scheduled for today</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowTaskForm(true)}
                >
                  Add a task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysTasks.slice(0, 3).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleTaskToggle}
                    onDelete={handleTaskDelete}
                  />
                ))}
                {todaysTasks.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{todaysTasks.length - 3} more tasks today
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p>No overdue tasks!</p>
                <p className="text-sm">Great job staying on track</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleTaskToggle}
                    onDelete={handleTaskDelete}
                  />
                ))}
                {overdueTasks.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{overdueTasks.length - 3} more overdue tasks
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent tasks</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowTaskForm(true)}
              >
                Create your first task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Add Task</h2>
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
                expanded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}