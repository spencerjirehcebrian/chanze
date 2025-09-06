import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, AuthTokens } from '../types/auth'
import { TokenManager } from '../utils/token'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void
  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        loading: true,
        error: null,

        setAuth: (user, tokens) => {
          TokenManager.setTokens(tokens)
          set(() => ({
            user,
            tokens,
            isAuthenticated: true,
            loading: false,
            error: null
          }), undefined, 'auth/setAuth')
        },

        setUser: (user) => set(() => ({
          user,
          isAuthenticated: !!user && !!get().tokens,
          loading: false
        }), undefined, 'auth/setUser'),

        setTokens: (tokens) => {
          TokenManager.setTokens(tokens)
          set((state) => ({
            tokens,
            isAuthenticated: !!tokens && !!state.user
          }), undefined, 'auth/setTokens')
        },

        setLoading: (loading) => set(() => ({
          loading
        }), undefined, 'auth/setLoading'),

        setError: (error) => set(() => ({
          error
        }), undefined, 'auth/setError'),

        clearAuth: () => {
          TokenManager.clearAuth()
          set(() => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            loading: false,
            error: null
          }), undefined, 'auth/clearAuth')
        },

        initializeAuth: () => {
          const storedTokens = TokenManager.getTokens()
          const storedUser = localStorage.getItem('auth_user')
          
          if (storedTokens && storedUser && !TokenManager.isExpired(storedTokens)) {
            try {
              const user = JSON.parse(storedUser)
              set(() => ({
                user,
                tokens: storedTokens,
                isAuthenticated: true,
                loading: false,
                error: null
              }), undefined, 'auth/initializeAuth')
            } catch (error) {
              console.error('Failed to parse stored user:', error)
              get().clearAuth()
            }
          } else {
            set(() => ({
              user: null,
              tokens: null,
              isAuthenticated: false,
              loading: false,
              error: null
            }), undefined, 'auth/initializeAuth')
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)