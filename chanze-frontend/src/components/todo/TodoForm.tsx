import { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import type { TodoFormData } from '../../types';

interface TodoFormProps {
  onSubmit: (data: TodoFormData) => Promise<void>;
  loading?: boolean;
}

export function TodoForm({ onSubmit, loading = false }: TodoFormProps) {
  const [task, setTask] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.trim()) {
      setError('Task is required');
      return;
    }

    try {
      setError('');
      await onSubmit({ task: task.trim() });
      setTask('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
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
    </form>
  );
}