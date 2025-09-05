import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { User } from '@/types'

interface DashboardPageProps {
  user?: User
  onSignOut?: () => void
}

export function DashboardPage({ user, onSignOut }: DashboardPageProps) {
  return (
    <DashboardLayout user={user} onSignOut={onSignOut} title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Your main workspace for managing your application.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Dashboard</CardTitle>
            <CardDescription>
              This is your main workspace. Add your own components and features here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is a clean, scalable dashboard foundation. You can now add:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Custom widgets and statistics</li>
                <li>Data visualization components</li>
                <li>Recent activity feeds</li>
                <li>Quick action buttons</li>
                <li>Navigation to other features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}