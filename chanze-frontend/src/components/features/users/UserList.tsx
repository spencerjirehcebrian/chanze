import type { User } from '@/types'
import { UserCard } from './UserCard'
import { LoadingSpinner } from '../../ui'

interface UserListProps {
  users: User[]
  loading?: boolean
  error?: string
  onEditUser?: (user: User) => void
  onDeleteUser?: (user: User) => void
  emptyMessage?: string
}

export function UserList({ 
  users, 
  loading = false, 
  error,
  onEditUser,
  onDeleteUser,
  emptyMessage = "No users found" 
}: UserListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
        />
      ))}
    </div>
  )
}