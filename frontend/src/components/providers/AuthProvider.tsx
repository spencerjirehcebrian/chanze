import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, SignInCredentials, SignUpCredentials } from '../../types/auth'
import { AuthService } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'
import { TokenManager } from '../../utils/token'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  signIn: (credentials: SignInCredentials) => Promise<void>
  signUp: (credentials: SignUpCredentials) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
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
  } = useAuthStore()

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize auth state from stored data
        initializeAuth()
        
        // Check if stored token is still valid
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser && !user) {
          const tokens = TokenManager.getTokens()
          if (tokens) {
            setAuth(currentUser, tokens)
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        clearAuth()
      } finally {
        setIsInitialized(true)
        setLoading(false)
      }
    }

    initialize()
  }, [user, setAuth, clearAuth, initializeAuth, setLoading])

  // Set up auth state change listener
  useEffect(() => {
    if (!isInitialized) return

    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      if (user && !isAuthenticated) {
        const tokens = TokenManager.getTokens()
        if (tokens && !TokenManager.isExpired(tokens)) {
          setAuth(user, tokens)
        }
      } else if (!user && isAuthenticated) {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [isInitialized, isAuthenticated, setAuth, clearAuth])

  const signIn = async (credentials: SignInCredentials): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await AuthService.signInWithPassword(credentials)
      
      if (response.error) {
        throw response.error
      }

      if (!response.data) {
        throw new Error('No data received from sign in')
      }

      setAuth(response.data.user, response.data.tokens)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (credentials: SignUpCredentials): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await AuthService.signUp(credentials)
      
      if (response.error) {
        throw response.error
      }

      // Don't auto-login after signup - user may need to verify email
      setError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await AuthService.signOut()
    } catch (error) {
      console.warn('Sign out error:', error)
    } finally {
      clearAuth()
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    const response = await AuthService.resetPassword(email)
    
    if (response.error) {
      throw response.error
    }
  }

  const value: AuthContextType = {
    user,
    loading: loading || !isInitialized,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}