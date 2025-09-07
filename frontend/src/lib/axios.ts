import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { TokenManager } from '../utils/token'
import { AuthService } from '../services/authService'

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get current valid token (this will refresh if needed)
      const tokens = await AuthService.getCurrentSession()
      
      if (tokens?.accessToken) {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }
      }
    } catch (error) {
      console.warn('Failed to get auth session for request:', error)
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - attempt token refresh
      try {
        const refreshResult = await AuthService.refreshToken()
        
        if (refreshResult.data && !refreshResult.error) {
          // Retry the original request with new token
          if (error.config?.headers) {
            error.config.headers.Authorization = `Bearer ${refreshResult.data.accessToken}`
          }
          return axiosInstance.request(error.config!)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
      
      // Refresh failed or not possible, clear auth and redirect
      TokenManager.clearAuth()
      
      // Only redirect if not already on auth pages
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance

// Utility functions for common HTTP methods
export const httpClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.get(url, config),
    
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.post(url, data, config),
    
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.put(url, data, config),
    
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.patch(url, data, config),
    
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.delete(url, config),
}