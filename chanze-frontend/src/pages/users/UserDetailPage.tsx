import { DashboardLayout } from '@/components/layout'
import { UserProfileForm } from '@/components/forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import type { User } from '@/types/database'
import { ArrowLeft, Mail, Calendar, Shield } from 'lucide-react'

interface UserDetailPageProps {
  user?: User
  targetUser?: User // The user being viewed/edited
  onSignOut?: () => void
  onBack?: () => void
}

export function UserDetailPage({ user, targetUser, onSignOut, onBack }: UserDetailPageProps) {
  const viewingUser = targetUser || user

  const handleUpdateProfile = async (data: { email: string; firstName?: string; lastName?: string }) => {
    console.log('Update profile:', data)
    // API call to update user profile
  }

  if (!viewingUser) {
    return (
      <DashboardLayout user={user} onSignOut={onSignOut} title="User Details">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user} onSignOut={onSignOut} title="User Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Details</h2>
              <p className="text-muted-foreground">
                {targetUser ? 'Manage user information' : 'Manage your account information'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Basic account details and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground">
                      {targetUser ? 'Team Member' : 'Owner'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <UserProfileForm
              user={viewingUser}
              onSubmit={handleUpdateProfile}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}