// API services
export * from './api'

// Task services
export { TaskService } from './TaskService'
export { TaskScheduleService, type DeletionType, type DateRange } from './TaskScheduleService'

// Utility services
export { storageService } from './storage'
export { notificationsService, type ToastOptions } from './notifications'

// Legacy exports
export * from './authService'

// Legacy compatibility
export { TaskService as TodoService } from './TaskService'