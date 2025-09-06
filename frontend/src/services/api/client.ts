import { TokenManager } from '../../utils/token'

export class ApiError extends Error {
  status?: number
  code?: string
  
  constructor(
    message: string,
    status?: number,
    code?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

class ApiClient {
  private baseUrl: string
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      
      if (!response.ok) {
        return {
          data: null,
          error: new ApiError(
            data.message || 'An error occurred',
            response.status,
            data.code
          )
        }
      }
      
      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: new ApiError(
          error instanceof Error ? error.message : 'Failed to parse response'
        )
      }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return TokenManager.createAuthHeaders()
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        data: null,
        error: new ApiError(
          error instanceof Error ? error.message : 'Network error'
        )
      }
    }
  }

  async post<T, D = any>(endpoint: string, data?: D): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      })
      
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        data: null,
        error: new ApiError(
          error instanceof Error ? error.message : 'Network error'
        )
      }
    }
  }

  async put<T, D = any>(endpoint: string, data?: D): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      })
      
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        data: null,
        error: new ApiError(
          error instanceof Error ? error.message : 'Network error'
        )
      }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })
      
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        data: null,
        error: new ApiError(
          error instanceof Error ? error.message : 'Network error'
        )
      }
    }
  }
}

// Create a default instance
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_URL || '/api'
)