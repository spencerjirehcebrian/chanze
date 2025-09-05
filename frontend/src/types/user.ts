import type { UserRole, UserPreferences } from './auth'

// Core user types
export interface BaseUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface PublicUser extends BaseUser {
  displayName: string
  avatar?: string
  role: UserRole
  isOnline?: boolean
  lastSeen?: string
}

export interface PrivateUser extends PublicUser {
  firstName?: string
  lastName?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  preferences: UserPreferences
  emailVerified: boolean
  phoneNumber?: string
  phoneVerified: boolean
}

// User management types
export interface CreateUserRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  avatar?: string
}

export interface UpdateUserPreferencesRequest {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notifications?: Partial<{
    email: boolean
    push: boolean
    marketing: boolean
    mentions: boolean
    comments: boolean
    updates: boolean
  }>
}

// User activity and stats
export interface UserActivity {
  id: string
  userId: string
  type: ActivityType
  description: string
  metadata?: Record<string, any>
  timestamp: string
}

export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'profile_update' 
  | 'password_change'
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'comment_added'
  | 'file_uploaded'

export interface UserStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number
  streakDays: number
  totalLogins: number
  lastLoginDate: string
  registrationDate: string
}

// Team and collaboration
export interface TeamMember {
  user: PublicUser
  role: TeamRole
  joinedAt: string
  invitedBy: string
  permissions: Permission[]
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission = 
  | 'read'
  | 'write'
  | 'delete'
  | 'invite'
  | 'manage_roles'
  | 'manage_settings'

// User search and filtering
export interface UserSearchFilters {
  role?: UserRole
  isOnline?: boolean
  lastSeen?: {
    from?: string
    to?: string
  }
  registrationDate?: {
    from?: string
    to?: string
  }
  emailVerified?: boolean
}

export interface UserSearchResult {
  users: PublicUser[]
  total: number
  facets: {
    roles: Record<UserRole, number>
    onlineStatus: {
      online: number
      offline: number
    }
  }
}