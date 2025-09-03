import { Button } from '../ui'
import type { User } from '@/types'

interface HeaderProps {
  user?: User
  onSignOut?: () => void
  title?: string
}

export function Header({ user, onSignOut, title = "Chanze" }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        
        {user && onSignOut && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}