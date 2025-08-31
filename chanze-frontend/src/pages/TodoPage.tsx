import { AlertCircle } from 'lucide-react';
import { useTodos } from '../hooks';
import { TodoForm, TodoList } from '../components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '../components/theme-toggle';
import type { User, TodoFormData } from '../types';

interface TodoPageProps {
  user: User;
  onSignOut: () => Promise<void>;
}

export function TodoPage({ user, onSignOut }: TodoPageProps) {
  const {
    todos,
    isLoading,
    error,
    createTodo,
    deleteTodo,
    toggleTodo,
    isCreating,
    isDeleting,
    isToggling,
  } = useTodos();

  const handleCreateTodo = async (data: TodoFormData) => {
    await createTodo({
      task: data.task,
      user_id: user.id,
      is_complete: false,
    });
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Error
            </CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Something went wrong'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">My Todos</CardTitle>
                <CardDescription className="text-lg">
                  Stay organized and productive
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <ThemeToggle />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <TodoForm 
              onSubmit={handleCreateTodo} 
              loading={isCreating} 
            />

            <TodoList
              todos={todos}
              onToggle={async (id, isComplete) => {
                await toggleTodo({ id, isComplete });
              }}
              onDelete={async (id) => {
                await deleteTodo(id);
              }}
              loading={isLoading}
              disabled={isDeleting || isToggling}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}