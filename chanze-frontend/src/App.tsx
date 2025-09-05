import { useState } from 'react';
import { useAuth } from './hooks';
import { AuthPage, LoadingPage } from './pages';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { MainLayout } from './components/layout/MainLayout';
import { ThemeProvider } from './lib/theme-provider';

type PageType = 'dashboard' | 'calendar' | 'templates';

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  if (loading) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="chanze-ui-theme">
        <LoadingPage />
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="chanze-ui-theme">
        <AuthPage onSignIn={signIn} onSignUp={signUp} />
      </ThemeProvider>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'templates':
        return <TemplatesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="chanze-ui-theme">
      <MainLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSignOut={signOut}
      >
        {renderCurrentPage()}
      </MainLayout>
    </ThemeProvider>
  );
}
