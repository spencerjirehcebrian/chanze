import type { User as SupabaseUser } from '@supabase/supabase-js'

// Extend Supabase User with app-specific fields
export interface User extends SupabaseUser {
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  role: UserRole
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'user' | 'moderator' | 'viewer'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: NotificationPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  marketing: boolean
  mentions: boolean
  comments: boolean
  updates: boolean
}

// Authentication types
export interface SignInCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface SignUpCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
  acceptTerms: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthSession {
  user: User
  tokens: AuthTokens
  isValid: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Password reset
export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
  confirmPassword: string
}

// Social auth
export type SocialProvider = 'google' | 'github' | 'discord' | 'twitter'

export interface SocialAuthData {
  provider: SocialProvider
  providerId: string
  email: string
  name?: string
  avatar?: string
}