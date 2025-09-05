import type { User } from '@/types'

// Token utilities
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= expirationTime
  } catch {
    return true // Consider invalid tokens as expired
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return new Date(payload.exp * 1000)
  } catch {
    return null
  }
}

export function parseJWTPayload(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

// User role and permission utilities
export function hasRole(user: User | null, role: string): boolean {
  // Simplified: check user metadata if it exists
  const metadata = user && 'user_metadata' in user ? (user as any).user_metadata : null
  if (!metadata?.role) return false
  return metadata.role === role
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  const metadata = user && 'user_metadata' in user ? (user as any).user_metadata : null
  if (!metadata?.role) return false
  return roles.includes(metadata.role)
}

export function hasPermission(user: User | null, permission: string): boolean {
  // In a real app, you'd check user permissions
  // This is a simplified example
  if (!user) return false
  
  const rolePermissions: Record<string, string[]> = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    moderator: ['read', 'write', 'delete'],
    user: ['read', 'write'],
    viewer: ['read'],
  }
  
  const metadata = user && 'user_metadata' in user ? (user as any).user_metadata : null
  const userRole = metadata?.role || 'viewer'
  const permissions = rolePermissions[userRole] || []
  
  return permissions.includes(permission)
}

export function canAccessRoute(user: User | null, routePermissions: string[] = []): boolean {
  if (routePermissions.length === 0) return true
  return routePermissions.some(permission => hasPermission(user, permission))
}

// User display utilities
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Unknown User'
  
  const metadata = user && 'user_metadata' in user ? (user as any).user_metadata : null
  if (metadata?.displayName) return metadata.displayName
  if (metadata?.firstName && metadata?.lastName) {
    return `${metadata.firstName} ${metadata.lastName}`
  }
  if (metadata?.firstName) return metadata.firstName
  if (user.email) return user.email
  
  return 'Unknown User'
}

export function getUserInitials(user: User | null): string {
  const displayName = getUserDisplayName(user)
  
  if (displayName === 'Unknown User') return 'UU'
  
  const words = displayName.split(' ')
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  
  return displayName.substring(0, 2).toUpperCase()
}

export function getUserAvatarUrl(user: User | null, size: number = 40): string {
  if (!user) return generateAvatarUrl('UU', size)
  
  const metadata = user && 'user_metadata' in user ? (user as any).user_metadata : null
  if (metadata?.avatar) return metadata.avatar
  
  const initials = getUserInitials(user)
  return generateAvatarUrl(initials, size)
}

function generateAvatarUrl(initials: string, size: number): string {
  // Generate a simple avatar using a service like DiceBear or similar
  const colors = ['6366f1', '8b5cf6', 'ec4899', 'ef4444', 'f97316', 'f59e0b', '84cc16', '22c55e', '06b6d4', '3b82f6']
  const colorIndex = initials.charCodeAt(0) % colors.length
  const color = colors[colorIndex]
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${color}&color=ffffff&bold=true`
}

// Session utilities
export function isAuthenticated(user: User | null): boolean {
  return user !== null
}

export function isEmailVerified(user: User | null): boolean {
  // Simplified: check if user exists and has email
  return user != null && !!user.email
}

export function getAccountAge(user: User | null): number {
  if (!user?.created_at) return 0
  const createdAt = new Date(user.created_at)
  const now = new Date()
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
}

// Password utilities
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function getPasswordStrength(password: string): {
  score: number // 0-4
  label: string
  color: string
} {
  let score = 0
  
  // Length
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // Character types
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++
  
  // Normalize to 0-4 scale
  score = Math.min(Math.floor(score / 1.5), 4)
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e']
  
  return {
    score,
    label: labels[score],
    color: colors[score]
  }
}