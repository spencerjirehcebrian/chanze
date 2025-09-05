import { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: string) => Promise<void>;
  loading?: boolean;
}

export function AddTaskModal({ open, onClose, onSubmit, loading = false }: AddTaskModalProps) {
  const [task, setTask] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    
    await onSubmit(task.trim());
    setTask('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What needs to be done?"
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!task.trim() || loading}>
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}