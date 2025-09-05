import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTodos } from '../hooks';
import { TodoList, Layout, AddTaskModal } from '../components';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '../types/database';

interface TodoPageProps {
  user: User;
  onSignOut: () => Promise<void>;
}

export function TodoPage({ user, onSignOut }: TodoPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleCreateTodo = async (task: string) => {
    await createTodo({
      task,
      user_id: user.id,
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
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Something went wrong'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Layout
      onAddTask={() => setShowAddModal(true)}
      onSignOut={handleSignOut}
    >
      <div className="px-4 pt-8">
        <div className="max-w-md mx-auto">
          <TodoList
            todos={todos}
            onToggle={async (id, isComplete) => {
              await toggleTodo({ id, isComplete });
            }}
            onDelete={async (id) => {
              await deleteTodo({ id });
            }}
            loading={isLoading}
            disabled={isDeleting || isToggling}
          />
        </div>
      </div>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTodo}
        loading={isCreating}
      />
    </Layout>
  );
}