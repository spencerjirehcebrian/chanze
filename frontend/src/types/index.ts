// API types
export * from './api'

// Authentication types
export type { User as AuthUser, UserProfile, UserRole, UserPreferences, NotificationPreferences, SignInCredentials, SignUpCredentials, AuthTokens, AuthSession, AuthState as CustomAuthState, PasswordResetRequest, PasswordResetConfirm, SocialProvider, SocialAuthData } from './auth'

// User types
export type { BaseUser, PublicUser, PrivateUser, CreateUserRequest, UpdateUserRequest, UpdateUserPreferencesRequest, UserActivity, ActivityType, UserStats, TeamMember, TeamRole, Permission, UserSearchFilters, UserSearchResult } from './user'

// Common utility types
export * from './common'

// Database types (Task system)
export * from './database'

// Legacy interfaces (to be refactored)
export interface AuthState {
  user: import('./database').User | null;
  loading: boolean;
}

// Task form data interface
export interface TaskFormData {
  task: string;
  dueDate?: Date;
  priority?: 0 | 1 | 2;
  tags?: string[];
  notes?: string;
  repeat?: {
    enabled: boolean;
    days: number[]; // Days of week (0=Sunday, 1=Monday, etc.)
    until?: Date;
  };
}

// Legacy alias for backward compatibility
export interface TodoFormData extends TaskFormData {
  // Empty interface extending TaskFormData - no additional properties needed
}