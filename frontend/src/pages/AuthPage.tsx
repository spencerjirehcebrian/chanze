import { ClipboardList } from 'lucide-react';
import { AuthForm } from '../components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SignInCredentials, SignUpCredentials } from '../types/auth';

interface AuthPageProps {
  onSignIn: (credentials: SignInCredentials) => Promise<void>;
  onSignUp: (credentials: SignUpCredentials) => Promise<void>;
  loading?: boolean;
}

export function AuthPage({ onSignIn, onSignUp, loading = false }: AuthPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription className="text-lg">
              Sign in to manage your todos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AuthForm onSignIn={onSignIn} onSignUp={onSignUp} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}