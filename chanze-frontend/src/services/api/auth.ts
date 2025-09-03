import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: User | null
  error: Error | null
}

class AuthService {
  async signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Sign in failed')
      }
    }
  }

  async signUp({ email, password, firstName, lastName }: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) {
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Sign up failed')
      }
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Sign out failed')
      }
    }
  }

  async getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return { user: null, error }
      }

      return { user, error: null }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Failed to get current user')
      }
    }
  }

  async refreshSession(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.refreshSession()
      return { error }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to refresh session')
      }
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      return { error }
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to send reset password email')
      }
    }
  }
}

export const authService = new AuthService()