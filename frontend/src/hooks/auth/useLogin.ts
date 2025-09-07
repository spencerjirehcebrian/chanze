import { useState } from 'react'
import { useAuthContext } from '@/hooks/useAuthContext'

export function useLogin() {
  const { signIn } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await signIn({ email, password })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    login,
    loading,
    error,
    clearError
  }
}