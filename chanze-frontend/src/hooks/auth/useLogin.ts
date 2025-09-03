import { useState } from 'react'
import { useAuthContext } from '@/components/providers'

export function useLogin() {
  const { signIn } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
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