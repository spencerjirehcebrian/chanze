// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Nullable<T> = T | null

export type Maybe<T> = T | null | undefined

export type EmptyObject = Record<string, never>

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error'

export type AsyncStatus = 'pending' | 'fulfilled' | 'rejected'

// Generic response wrapper
export interface ResponseWrapper<T> {
  data?: T
  error?: string
  loading: boolean
  success: boolean
}

// Date and time
export type DateString = string // ISO 8601 format
export type Timestamp = number // Unix timestamp

export interface DateRange {
  start: DateString
  end: DateString
}

export interface TimeRange {
  start: string // HH:mm format
  end: string   // HH:mm format
}

// Sorting and filtering
export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T = string> {
  field: T
  direction: SortDirection
}

export interface FilterConfig<T = any> {
  field: string
  operator: FilterOperator
  value: T
}

export type FilterOperator = 
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains'
  | 'startswith'
  | 'endswith'

// Pagination
export interface PaginationConfig {
  page: number
  limit: number
  offset?: number
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
}

// Form and validation
export interface FormField<T = string> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
  valid: boolean
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export type FormErrors<T> = Partial<Record<keyof T, string>>

// UI State
export interface LoadingState {
  [key: string]: boolean
}

export interface ModalState {
  [key: string]: {
    isOpen: boolean
    data?: any
  }
}

// File handling
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

export interface UploadedFile extends FileInfo {
  id: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  uploadedBy: string
}

// Generic CRUD operations
export type CrudOperation = 'create' | 'read' | 'update' | 'delete'

export interface CrudResult<T> {
  operation: CrudOperation
  success: boolean
  data?: T
  error?: string
}

// Event types
export interface AppEvent<T = any> {
  type: string
  payload: T
  timestamp: number
  source: string
}

// Configuration
export interface Config {
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  features: {
    [feature: string]: boolean
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
  }
}

// Generic ID types
export type ID = string | number
export type UUID = string