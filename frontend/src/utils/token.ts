import type { AuthTokens } from '../types/auth';

export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_tokens';
  private static readonly USER_KEY = 'auth_user';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Get stored auth tokens from localStorage
   */
  static getTokens(): AuthTokens | null {
    try {
      const tokens = localStorage.getItem(this.TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }

  /**
   * Store auth tokens in localStorage
   */
  static setTokens(tokens: AuthTokens | null): void {
    if (tokens) {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
      // Store refresh token separately for security
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Get only the access token
   */
  static getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens && !this.isExpired(tokens) ? tokens.accessToken : null;
  }

  /**
   * Get only the refresh token
   */
  static getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return refreshToken || null;
  }

  /**
   * Check if token is expired (with 5 minute buffer)
   */
  static isExpired(tokens: AuthTokens): boolean {
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (tokens.expiresAt - buffer);
  }

  /**
   * Check if token will expire soon (within 15 minutes)
   */
  static willExpireSoon(tokens: AuthTokens): boolean {
    const buffer = 15 * 60 * 1000; // 15 minutes in milliseconds
    return Date.now() >= (tokens.expiresAt - buffer);
  }

  /**
   * Clear all stored auth data
   */
  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.clear(); // Clear any session data as well
  }

  /**
   * Decode JWT token payload (without verification)
   * Use only for extracting non-sensitive client-side data
   */
  static decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Get token expiration time from JWT
   */
  static getTokenExpiration(token: string): number | null {
    const payload = this.decodeJWT(token);
    return payload?.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    return typeof token === 'string' && token.split('.').length === 3;
  }

  /**
   * Create auth headers for API requests
   */
  static createAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token
      ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const tokens = this.getTokens();
    return tokens !== null && !this.isExpired(tokens);
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiry(tokens: AuthTokens): number {
    return Math.max(0, tokens.expiresAt - Date.now());
  }

  /**
   * Format expiration time for display
   */
  static formatExpirationTime(tokens: AuthTokens): string {
    const timeUntilExpiry = this.getTimeUntilExpiry(tokens);
    const minutes = Math.floor(timeUntilExpiry / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Less than a minute';
  }

  /**
   * Setup automatic token refresh
   * Returns cleanup function
   */
  static setupAutoRefresh(
    refreshCallback: () => Promise<void>,
    checkInterval: number = 60000 // Check every minute
  ): () => void {
    const intervalId = setInterval(async () => {
      const tokens = this.getTokens();
      if (tokens && this.willExpireSoon(tokens)) {
        try {
          await refreshCallback();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
        }
      }
    }, checkInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  /**
   * Handle storage events for multi-tab sync
   */
  static onStorageChange(callback: (tokens: AuthTokens | null) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.TOKEN_KEY) {
        const tokens = e.newValue ? JSON.parse(e.newValue) : null;
        callback(tokens);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => window.removeEventListener('storage', handleStorageChange);
  }
}

export default TokenManager;