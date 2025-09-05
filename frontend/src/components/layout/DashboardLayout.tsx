import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import type { User } from '@/types'

interface DashboardLayoutProps {
  children: ReactNode
  user?: User
  onSignOut?: () => void
  title?: string
  showSidebar?: boolean
}

export function DashboardLayout({ 
  children, 
  user, 
  onSignOut, 
  title,
  showSidebar = true 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} onSignOut={onSignOut} title={title} />
      
      <div className="flex-1 flex">
        {showSidebar && (
          <Sidebar className="hidden md:flex" />
        )}
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}