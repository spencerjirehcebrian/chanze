import { useState } from 'react'
import { RegisterForm } from '@/components/forms'
import { AuthLayout } from '@/components/layout'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui'

interface RegisterPageProps {
  onSwitchToLogin?: () => void
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await signUp({ email, password, acceptTerms: true })
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
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">
            Get started with your new account
          </p>
        </div>
        
        <RegisterForm
          onSubmit={handleSignUp}
          isLoading={loading}
          error={error || undefined}
        />
        
        {onSwitchToLogin && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={onSwitchToLogin}
              >
                Sign in here
              </Button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}