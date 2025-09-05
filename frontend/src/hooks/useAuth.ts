import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../services';
import type { User } from '../types/database';
import type { AuthState } from '../types';

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await AuthService.getCurrentSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      AuthService.signInWithPassword(email, password),
    onError: (error: Error) => {
      throw new Error(`Sign in failed: ${error.message}`);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      AuthService.signUp(email, password),
    onError: (error: Error) => {
      throw new Error(`Sign up failed: ${error.message}`);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: AuthService.signOut,
    onSuccess: () => {
      setUser(null);
    },
    onError: (error: Error) => {
      throw new Error(`Sign out failed: ${error.message}`);
    },
  });

  return {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      await signInMutation.mutateAsync({ email, password });
    },
    signUp: async (email: string, password: string) => {
      await signUpMutation.mutateAsync({ email, password });
    },
    signOut: signOutMutation.mutateAsync,
  };
}