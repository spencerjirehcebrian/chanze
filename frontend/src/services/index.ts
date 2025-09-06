// API services
export { apiClient, ApiError, type ApiResponse } from './api/client'
export { authService, type SignInCredentials, type SignUpCredentials } from './api/auth'
export type { AuthResponse as ApiAuthResponse } from './api/auth'

// Task services
export { TaskService } from './TaskService'
export { TaskScheduleService, type DeletionType, type DateRange } from './TaskScheduleService'

// Utility services
export { storageService } from './storage'
export { notificationsService, type ToastOptions } from './notifications'

// Main auth service exports
export { AuthService, type AuthResponse } from './authService'

// Legacy compatibility
export { TaskService as TodoService } from './TaskService'