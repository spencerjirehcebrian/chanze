import { TemplateManager } from '../components/templates';

export function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage recurring task templates
          </p>
        </div>
      </div>

      {/* Template Manager */}
      <TemplateManager />
    </div>
  );
}