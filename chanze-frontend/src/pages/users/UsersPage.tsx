import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import { UserList } from '@/components/features'
import { Button, Input } from '@/components/ui'
import type { User } from '@/types/database'
import { Search, UserPlus } from 'lucide-react'

interface UsersPageProps {
  user?: User
  onSignOut?: () => void
}

export function UsersPage({ user, onSignOut }: UsersPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock users data - in a real app this would come from API
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      created_at: '2025-01-02T00:00:00.000Z'
    },
    {
      id: '3',
      email: 'bob.wilson@example.com',
      created_at: '2025-01-03T00:00:00.000Z'
    }
  ]

  const filteredUsers = mockUsers.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user)
    // Navigate to user edit page or open modal
  }

  const handleDeleteUser = (user: User) => {
    console.log('Delete user:', user)
    // Show confirmation dialog and delete user
  }

  const handleAddUser = () => {
    console.log('Add new user')
    // Navigate to add user page or open modal
  }

  return (
    <DashboardLayout user={user} onSignOut={onSignOut} title="Users">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">
              Manage your team members and their access.
            </p>
          </div>
          <Button onClick={handleAddUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <UserList
          users={filteredUsers}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          emptyMessage={
            searchQuery 
              ? `No users found matching "${searchQuery}"` 
              : "No users found. Add your first team member!"
          }
        />
      </div>
    </DashboardLayout>
  )
}