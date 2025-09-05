import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        loading: true,

        setUser: (user) => set(() => ({
          user,
          isAuthenticated: !!user,
          loading: false
        }), undefined, 'auth/setUser'),

        setLoading: (loading) => set(() => ({
          loading
        }), undefined, 'auth/setLoading'),

        clearAuth: () => set(() => ({
          user: null,
          isAuthenticated: false,
          loading: false
        }), undefined, 'auth/clearAuth'),
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