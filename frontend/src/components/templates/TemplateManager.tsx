import { useState } from 'react';
import { Plus, Repeat, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateItem } from './TemplateItem';
import { TemplateForm } from './TemplateForm';
import { useTaskTemplates } from '../../hooks/useTasks';
import type { TaskTemplate, CreateTaskRequest } from '../../types/database';

interface TemplateManagerProps {
  className?: string;
}

export function TemplateManager({ className }: TemplateManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const { 
    templates, 
    isLoading, 
    error, 
    createTemplate,
    isCreating 
  } = useTaskTemplates();

  // Filter templates based on active/inactive status
  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return template.is_repeating && (!template.repeat_until || new Date(template.repeat_until) >= new Date());
    }
    if (filter === 'inactive') {
      return !template.is_repeating || (template.repeat_until && new Date(template.repeat_until) < new Date());
    }
    return true;
  });

  const handleCreateTemplate = async (templateData: CreateTaskRequest) => {
    await createTemplate(templateData);
    setShowCreateForm(false);
  };

  const getTemplateStats = () => {
    const total = templates.length;
    const active = templates.filter(t => 
      t.is_repeating && (!t.repeat_until || new Date(t.repeat_until) >= new Date())
    ).length;
    const inactive = total - active;

    return { total, active, inactive };
  };

  const { total, active, inactive } = getTemplateStats();

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load templates: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Templates</h2>
          <p className="text-muted-foreground">
            Manage your recurring task templates and patterns
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{active}</p>
              </div>
              <Repeat className="w-8 h-8 text-green-500 ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">{inactive}</p>
              </div>
              <Settings className="w-8 h-8 text-gray-400 ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit">
        {[
          { id: 'active', label: 'Active', count: active },
          { id: 'inactive', label: 'Inactive', count: inactive },
          { id: 'all', label: 'All', count: total },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Templates list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' 
                  ? "You haven't created any templates yet."
                  : `No ${filter} templates found.`
                }
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
            />
          ))
        )}
      </div>

      {/* Create/Edit form modal */}
      {(showCreateForm || editingTemplate) && (
        <TemplateForm
          template={editingTemplate}
          onSubmit={editingTemplate ? undefined : handleCreateTemplate}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTemplate(null);
          }}
          loading={isCreating}
        />
      )}
    </div>
  );
}