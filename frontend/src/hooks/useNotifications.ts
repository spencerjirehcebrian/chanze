import { useContext } from 'react'
import { NotificationContext } from '../components/providers/NotificationProvider'

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}