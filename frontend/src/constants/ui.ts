// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export type Theme = typeof THEMES[keyof typeof THEMES]

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px', 
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  SLOWER: 500,
} as const

// Spacing scale (matching Tailwind CSS)
export const SPACING = {
  XS: '0.25rem', // 4px
  SM: '0.5rem',  // 8px
  MD: '1rem',    // 16px
  LG: '1.5rem',  // 24px
  XL: '2rem',    // 32px
  '2XL': '3rem', // 48px
  '3XL': '4rem', // 64px
} as const

// Color palette constants
export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    900: '#0f172a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    900: '#14532d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    900: '#92400e',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    900: '#7f1d1d',
  },
} as const

// Component sizes
export const SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const

export type Size = typeof SIZES[keyof typeof SIZES]

// Button variants
export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
  DESTRUCTIVE: 'destructive',
} as const

export type ButtonVariant = typeof BUTTON_VARIANTS[keyof typeof BUTTON_VARIANTS]

// Input variants
export const INPUT_VARIANTS = {
  DEFAULT: 'default',
  FILLED: 'filled',
  OUTLINE: 'outline',
} as const

export type InputVariant = typeof INPUT_VARIANTS[keyof typeof INPUT_VARIANTS]

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// Modal sizes
export const MODAL_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  FULL: 'full',
} as const

export type ModalSize = typeof MODAL_SIZES[keyof typeof MODAL_SIZES]

// Layout constants
export const LAYOUT = {
  HEADER_HEIGHT: '4rem',      // 64px
  SIDEBAR_WIDTH: '16rem',     // 256px
  SIDEBAR_COLLAPSED: '4rem',  // 64px
  FOOTER_HEIGHT: '4rem',      // 64px
  CONTAINER_MAX_WIDTH: '1280px',
} as const

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES]

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  PHONE_INVALID: 'Please enter a valid phone number',
  URL_INVALID: 'Please enter a valid URL',
} as const

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ],
  MAX_FILES: 10,
} as const

// Date and time formats
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  TIME_ONLY: 'h:mm a',
  ISO: 'yyyy-MM-dd',
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// Search and filtering
export const SEARCH = {
  MIN_QUERY_LENGTH: 3,
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_RESULTS: 100,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'chanze_auth_token',
  USER_PREFERENCES: 'chanze_user_preferences',
  THEME: 'chanze_theme',
  LANGUAGE: 'chanze_language',
  SIDEBAR_STATE: 'chanze_sidebar_state',
  RECENT_SEARCHES: 'chanze_recent_searches',
} as const