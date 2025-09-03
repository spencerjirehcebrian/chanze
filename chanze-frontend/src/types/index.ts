// API types
export * from './api'

// Authentication types
export type { User as AuthUser, UserProfile, UserRole, UserPreferences, NotificationPreferences, SignInCredentials, SignUpCredentials, AuthTokens, AuthSession, AuthState as CustomAuthState, PasswordResetRequest, PasswordResetConfirm, SocialProvider, SocialAuthData } from './auth'

// User types
export type { BaseUser, PublicUser, PrivateUser, CreateUserRequest, UpdateUserRequest, UpdateUserPreferencesRequest, UserActivity, ActivityType, UserStats, TeamMember, TeamRole, Permission, UserSearchFilters, UserSearchResult } from './user'

// Common utility types
export * from './common'

// Legacy database types
export * from './database'

// Legacy interfaces (to be refactored)
export interface AuthState {
  user: import('./database').User | null;
  loading: boolean;
}

export interface TodoFormData {
  task: string;
}