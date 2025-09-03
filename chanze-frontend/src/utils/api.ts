import type { ApiError, ApiResponse } from '@/types'

// Error handling utilities
export function createApiError(message: string, status?: number, code?: string): ApiError {
  return {
    message,
    status,
    code,
  }
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error.message === 'string'
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unknown error occurred'
}

// Response utilities
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    data,
    message,
    success: true,
  }
}

export function createErrorResponse<T>(error: string | ApiError): ApiResponse<T> {
  return {
    data: {} as T,
    message: typeof error === 'string' ? error : error.message,
    success: false,
  }
}

// Query parameter utilities
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function parseQueryString(queryString: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {}
  const searchParams = new URLSearchParams(queryString)
  
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  }
  
  return params
}

// URL utilities
export function buildUrl(baseUrl: string, path: string, params?: Record<string, any>): string {
  const url = new URL(path, baseUrl)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  
  return url.toString()
}

export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Request utilities
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

export function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0
    
    const executeRequest = async () => {
      try {
        const result = await requestFn()
        resolve(result)
      } catch (error) {
        attempt++
        
        if (attempt >= maxRetries) {
          reject(error)
          return
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1)
        setTimeout(executeRequest, delay)
      }
    }
    
    executeRequest()
  })
}

// Cache utilities
export class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

// Create a global cache instance
export const requestCache = new RequestCache()

// Response transformation utilities
export function transformResponse<T, U>(
  response: ApiResponse<T>,
  transformer: (data: T) => U
): ApiResponse<U> {
  if (!response.success) {
    return response as unknown as ApiResponse<U>
  }
  
  try {
    const transformedData = transformer(response.data)
    return {
      ...response,
      data: transformedData,
    }
  } catch (error) {
    return createErrorResponse(getErrorMessage(error))
  }
}

// Pagination utilities
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1
  
  return {
    currentPage: page,
    totalPages,
    pageSize: limit,
    totalCount: total,
    hasNext,
    hasPrevious: hasPrev,
  }
}

export function getPaginationRange(currentPage: number, totalPages: number, delta: number = 2) {
  const range = []
  const rangeWithDots = []
  
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i)
  }
  
  if (currentPage - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }
  
  rangeWithDots.push(...range)
  
  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages)
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages)
  }
  
  return rangeWithDots
}

// HTTP status utilities
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300
}

export function isClientError(status: number): boolean {
  return status >= 400 && status < 500
}

export function isServerError(status: number): boolean {
  return status >= 500 && status < 600
}

export function getStatusCategory(status: number): 'success' | 'client_error' | 'server_error' | 'unknown' {
  if (isSuccessStatus(status)) return 'success'
  if (isClientError(status)) return 'client_error'
  if (isServerError(status)) return 'server_error'
  return 'unknown'
}