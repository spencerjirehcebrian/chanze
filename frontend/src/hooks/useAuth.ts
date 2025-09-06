import { useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type { User, SignInCredentials, SignUpCredentials } from '../types/auth';
import { TokenManager } from '../utils/token';

export function useAuth() {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    setAuth,
    setLoading,
    setError,
    clearAuth,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();

    // Set up token storage listener for multi-tab sync
    const cleanup = TokenManager.onStorageChange((tokens) => {
      if (!tokens) {
        clearAuth();
      }
    });

    return cleanup;
  }, [initializeAuth, clearAuth]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const cleanup = TokenManager.setupAutoRefresh(async () => {
      const refreshResult = await AuthService.refreshToken();
      if (refreshResult.error) {
        console.error('Auto refresh failed:', refreshResult.error);
        clearAuth();
      }
    });

    return cleanup;
  }, [isAuthenticated, clearAuth]);

  const signInMutation = useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.signInWithPassword(credentials);
      
      if (response.error) {
        throw response.error;
      }
      
      if (!response.data) {
        throw new Error('No data received from sign in');
      }
      
      setAuth(response.data.user, response.data.tokens);
      return response.data;
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (credentials: SignUpCredentials) => {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.signUp(credentials);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
    onSuccess: () => {
      setLoading(false);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await AuthService.signOut();
      
      if (response.error) {
        console.warn('Sign out error:', response.error);
      }
      
      clearAuth();
    },
    onError: (error: Error) => {
      console.error('Sign out failed:', error);
      clearAuth(); // Clear auth even if API call fails
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { 
      currentPassword: string; 
      newPassword: string; 
    }) => {
      const response = await AuthService.changePassword(currentPassword, newPassword);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await AuthService.resetPassword(email);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
  });

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    await signInMutation.mutateAsync(credentials);
  }, [signInMutation]);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    await signUpMutation.mutateAsync(credentials);
  }, [signUpMutation]);

  const signOut = useCallback(async () => {
    await signOutMutation.mutateAsync();
  }, [signOutMutation]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  }, [changePasswordMutation]);

  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordMutation.mutateAsync(email);
  }, [resetPasswordMutation]);

  return {
    // State
    user,
    loading: loading || signInMutation.isPending || signUpMutation.isPending,
    error,
    isAuthenticated,
    
    // Actions
    signIn,
    signUp,
    signOut,
    changePassword,
    resetPassword,
    
    // Mutation states for granular loading states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}