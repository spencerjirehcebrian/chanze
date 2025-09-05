import { supabase } from '@/lib/supabase'

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

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`
      })
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
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
        headers: await this.getAuthHeaders(),
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
        headers: await this.getAuthHeaders(),
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
        headers: await this.getAuthHeaders(),
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