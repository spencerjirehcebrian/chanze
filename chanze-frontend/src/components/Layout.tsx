import { Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

interface LayoutProps {
  children: React.ReactNode;
  onAddTask: () => void;
  onSignOut: () => void;
}

export function Layout({ children, onAddTask, onSignOut }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar with Sign Out */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>

      <main className="pb-20 pt-16">
        {children}
      </main>
      
      {/* Minimal Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background/90 dock-blur border rounded-full px-6 py-3 shadow-xl animate-in">
          <div className="flex items-center gap-6">
            <div className="transition-all duration-200 hover:scale-110 active:scale-95">
              <ThemeToggle />
            </div>
            
            <Button
              size="sm"
              onClick={onAddTask}
              className="rounded-full w-12 h-12 p-0 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}