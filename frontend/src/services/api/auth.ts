import { AuthService } from '../authService'
import type { User, SignInCredentials, SignUpCredentials, AuthTokens } from '../../types/auth'

export type { SignInCredentials, SignUpCredentials } from '../../types/auth'

export interface AuthResponse<T = any> {
  data: T | null
  error: Error | null
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterResponse {
  user: User
  message: string
}

// Re-export the main AuthService with a different name for backward compatibility
export class ApiAuthService {
  static async signIn(credentials: SignInCredentials): Promise<AuthResponse<LoginResponse>> {
    return AuthService.signInWithPassword(credentials)
  }

  static async signUp(credentials: SignUpCredentials): Promise<AuthResponse<RegisterResponse>> {
    return AuthService.signUp(credentials)
  }

  static async signOut(): Promise<AuthResponse<void>> {
    return AuthService.signOut()
  }

  static async getCurrentUser(): Promise<User | null> {
    return AuthService.getCurrentUser()
  }

  static async getCurrentSession(): Promise<AuthTokens | null> {
    return AuthService.getCurrentSession()
  }

  static async refreshSession(): Promise<AuthResponse<AuthTokens>> {
    return AuthService.refreshToken()
  }

  static async resetPassword(email: string): Promise<AuthResponse<{ message: string }>> {
    return AuthService.resetPassword(email)
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse<{ message: string }>> {
    return AuthService.changePassword(currentPassword, newPassword)
  }
}

// Default export for backward compatibility
export const authService = ApiAuthService