import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui'
import type { User } from '@/types'
import { Button } from '../../ui'
import { Mail, User as UserIcon } from 'lucide-react'

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  showActions?: boolean
}

export function UserCard({ 
  user, 
  onEdit, 
  onDelete, 
  showActions = true 
}: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">{user.email}</CardTitle>
            <CardDescription>
              Created {new Date(user.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        
        {showActions && (onEdit || onDelete) && (
          <div className="flex space-x-2 mt-4">
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(user)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDelete(user)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}