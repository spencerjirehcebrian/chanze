import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/hooks'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        window.location.href = redirectTo
      } else if (!requireAuth && user) {
        window.location.href = '/'
      }
    }
  }, [user, loading, requireAuth, redirectTo])

  if (loading) {
    return null
  }

  if (requireAuth && !user) {
    return null
  }

  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}