import { useState } from 'react';
import { Home, Calendar, Template, LogOut, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { ThemeToggle } from '../theme-toggle';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'calendar' | 'templates';
  onPageChange: (page: 'dashboard' | 'calendar' | 'templates') => void;
  onSignOut: () => void;
}

const NAVIGATION_ITEMS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
  { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
  { id: 'templates' as const, label: 'Templates', icon: Template },
];

export function MainLayout({ children, currentPage, onPageChange, onSignOut }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePageChange = (page: 'dashboard' | 'calendar' | 'templates') => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>

          {/* Logo/Brand */}
          <div className="flex items-center gap-2 mr-6">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-lg">Chanze</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            {NAVIGATION_ITEMS.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePageChange(item.id)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only ml-2 hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-background border-r shadow-lg">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-lg">Chanze</span>
            </div>
            <nav className="p-2">
              {NAVIGATION_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageChange(item.id)}
                    className="w-full justify-start gap-3 mb-1"
                  >
                    <IconComponent className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* Mobile Bottom Actions */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}