import { useState } from 'react'
import { LoginForm } from '@/components/forms'
import { AuthLayout } from '@/components/layout'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui'

interface LoginPageProps {
  onSwitchToRegister?: () => void
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        
        <LoginForm
          onSubmit={handleSignIn}
          isLoading={loading}
          error={error || undefined}
        />
        
        {onSwitchToRegister && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={onSwitchToRegister}
              >
                Create one here
              </Button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}