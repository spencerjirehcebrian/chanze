import { API_ENDPOINTS } from '../constants/api';
import type { User, SignInCredentials, SignUpCredentials, AuthTokens } from '../types/auth';

export interface AuthResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_tokens';
  private static readonly USER_KEY = 'auth_user';
  
  private static getBaseUrl(): string {
    return import.meta.env.VITE_API_URL || '/api';
  }

  private static getStoredTokens(): AuthTokens | null {
    try {
      const tokens = localStorage.getItem(this.TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch {
      return null;
    }
  }

  private static setStoredTokens(tokens: AuthTokens | null): void {
    if (tokens) {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private static getStoredUser(): User | null {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  private static setStoredUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<AuthResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: new Error(data.message || 'Request failed'),
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Network error'),
      };
    }
  }

  static async signUp(credentials: SignUpCredentials): Promise<AuthResponse<RegisterResponse>> {
    return this.makeRequest<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async signInWithPassword(credentials: SignInCredentials): Promise<AuthResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data && !response.error) {
      this.setStoredTokens(response.data.tokens);
      this.setStoredUser(response.data.user);
    }

    return response;
  }

  static async signOut(): Promise<AuthResponse<void>> {
    const tokens = this.getStoredTokens();
    
    if (tokens) {
      await this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });
    }

    this.setStoredTokens(null);
    this.setStoredUser(null);

    return { data: null, error: null };
  }

  static async getCurrentSession(): Promise<AuthTokens | null> {
    const tokens = this.getStoredTokens();
    
    if (!tokens) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= tokens.expiresAt) {
      const refreshResult = await this.refreshToken();
      return refreshResult.data;
    }

    return tokens;
  }

  static async getCurrentUser(): Promise<User | null> {
    const user = this.getStoredUser();
    const tokens = await this.getCurrentSession();

    if (!user || !tokens) {
      return null;
    }

    return user;
  }

  static async refreshToken(): Promise<AuthResponse<AuthTokens>> {
    const tokens = this.getStoredTokens();
    
    if (!tokens?.refreshToken) {
      this.clearAuth();
      return { data: null, error: new Error('No refresh token available') };
    }

    const response = await this.makeRequest<{ tokens: AuthTokens; user: User }>(
      API_ENDPOINTS.AUTH.REFRESH,
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }
    );

    if (response.data && !response.error) {
      this.setStoredTokens(response.data.tokens);
      this.setStoredUser(response.data.user);
      return { data: response.data.tokens, error: null };
    }

    if (response.error) {
      this.clearAuth();
    }

    return { data: null, error: response.error };
  }

  static async resetPassword(email: string): Promise<AuthResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse<{ message: string }>> {
    const tokens = this.getStoredTokens();
    
    if (!tokens) {
      return { data: null, error: new Error('Not authenticated') };
    }

    return this.makeRequest<{ message: string }>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  private static clearAuth(): void {
    this.setStoredTokens(null);
    this.setStoredUser(null);
  }

  static isTokenExpired(token?: AuthTokens): boolean {
    if (!token) return true;
    return Date.now() >= token.expiresAt;
  }

  static getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens && !this.isTokenExpired(tokens) ? tokens.accessToken : null;
  }

  // Auth state change simulation for compatibility
  static onAuthStateChange(callback: (user: User | null) => void) {
    // Initial call
    this.getCurrentUser().then(callback);

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.USER_KEY) {
        const user = e.newValue ? JSON.parse(e.newValue) : null;
        callback(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  }
}