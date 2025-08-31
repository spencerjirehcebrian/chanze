import { useAuth } from './hooks';
import { AuthPage, TodoPage, LoadingPage } from './pages';
import { ThemeProvider } from './lib/theme-provider';

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

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

  return (
    <ThemeProvider defaultTheme="light" storageKey="chanze-ui-theme">
      <TodoPage user={user} onSignOut={signOut} />
    </ThemeProvider>
  );
}
