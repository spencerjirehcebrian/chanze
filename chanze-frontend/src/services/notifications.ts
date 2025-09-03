import type { NotificationType } from '@/components/providers'

export interface ToastOptions {
  title: string
  message?: string
  type?: NotificationType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

class NotificationsService {
  private notificationCallback?: (options: ToastOptions) => void

  // Initialize with the notification provider callback
  init(callback: (options: ToastOptions) => void) {
    this.notificationCallback = callback
  }

  private notify(options: ToastOptions) {
    if (this.notificationCallback) {
      this.notificationCallback(options)
    } else {
      // Fallback to console if provider not initialized
      console.log(`[${options.type?.toUpperCase()}] ${options.title}`, options.message)
    }
  }

  success(title: string, message?: string, options?: Partial<ToastOptions>) {
    this.notify({
      title,
      message,
      type: 'success',
      duration: 5000,
      ...options
    })
  }

  error(title: string, message?: string, options?: Partial<ToastOptions>) {
    this.notify({
      title,
      message,
      type: 'error',
      duration: 0, // Don't auto-dismiss errors
      ...options
    })
  }

  warning(title: string, message?: string, options?: Partial<ToastOptions>) {
    this.notify({
      title,
      message,
      type: 'warning',
      duration: 7000,
      ...options
    })
  }

  info(title: string, message?: string, options?: Partial<ToastOptions>) {
    this.notify({
      title,
      message,
      type: 'info',
      duration: 5000,
      ...options
    })
  }

  // Browser Notifications API
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    return await Notification.requestPermission()
  }

  async showBrowserNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    const permission = await this.requestPermission()
    
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      })
    }
  }

  // Service Worker push notifications (if available)
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      })
      
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        return await subscription.unsubscribe()
      }
      
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }
}

export const notificationsService = new NotificationsService()