// Application Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  
  // User management
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  USER_PROFILE: '/profile',
  USER_SETTINGS: '/settings',
  
  // Tasks (legacy)
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_PRIVACY: '/settings/privacy',
  SETTINGS_BILLING: '/settings/billing',
  
  // Error pages
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  
  // Special pages
  MAINTENANCE: '/maintenance',
  COMING_SOON: '/coming-soon',
} as const

// Route builders for dynamic routes
export const ROUTE_BUILDERS = {
  USER_DETAIL: (id: string) => `/users/${id}`,
  USER_EDIT: (id: string) => `/users/${id}/edit`,
  TASK_DETAIL: (id: string) => `/tasks/${id}`,
  TASK_EDIT: (id: string) => `/tasks/${id}/edit`,
} as const

// External routes
export const EXTERNAL_ROUTES = {
  PRIVACY_POLICY: '/privacy',
  TERMS_OF_SERVICE: '/terms',
  HELP_CENTER: '/help',
  CONTACT: '/contact',
  BLOG: '/blog',
  DOCUMENTATION: '/docs',
} as const

// API route patterns (for server-side routing)
export const API_ROUTES = {
  AUTH: '/api/auth/*',
  USERS: '/api/users/*',
  TASKS: '/api/tasks/*',
  FILES: '/api/files/*',
  WEBHOOKS: '/api/webhooks/*',
} as const

// Route metadata for navigation and breadcrumbs
export const ROUTE_META = {
  [ROUTES.HOME]: {
    title: 'Home',
    description: 'Dashboard home page',
    requiresAuth: false,
    showInNav: true,
    breadcrumb: 'Home',
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    description: 'Main dashboard',
    requiresAuth: true,
    showInNav: true,
    breadcrumb: 'Dashboard',
  },
  [ROUTES.ANALYTICS]: {
    title: 'Analytics',
    description: 'Analytics and reports',
    requiresAuth: true,
    showInNav: true,
    breadcrumb: 'Analytics',
  },
  [ROUTES.USERS]: {
    title: 'Users',
    description: 'User management',
    requiresAuth: true,
    showInNav: true,
    breadcrumb: 'Users',
    permissions: ['manage_users'],
  },
  [ROUTES.USER_PROFILE]: {
    title: 'Profile',
    description: 'User profile settings',
    requiresAuth: true,
    showInNav: false,
    breadcrumb: 'Profile',
  },
  [ROUTES.SETTINGS]: {
    title: 'Settings',
    description: 'Application settings',
    requiresAuth: true,
    showInNav: true,
    breadcrumb: 'Settings',
  },
  [ROUTES.LOGIN]: {
    title: 'Sign In',
    description: 'Sign in to your account',
    requiresAuth: false,
    showInNav: false,
    breadcrumb: 'Sign In',
  },
  [ROUTES.REGISTER]: {
    title: 'Create Account',
    description: 'Create a new account',
    requiresAuth: false,
    showInNav: false,
    breadcrumb: 'Sign Up',
  },
} as const

// Navigation structure
export const NAVIGATION = {
  MAIN: [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: 'Home',
      requiresAuth: true,
    },
    {
      name: 'Analytics',
      href: ROUTES.ANALYTICS,
      icon: 'BarChart3',
      requiresAuth: true,
    },
    {
      name: 'Users',
      href: ROUTES.USERS,
      icon: 'Users',
      requiresAuth: true,
      permissions: ['manage_users'],
    },
    {
      name: 'Settings',
      href: ROUTES.SETTINGS,
      icon: 'Settings',
      requiresAuth: true,
    },
  ],
  FOOTER: [
    {
      name: 'Privacy Policy',
      href: EXTERNAL_ROUTES.PRIVACY_POLICY,
      external: true,
    },
    {
      name: 'Terms of Service',
      href: EXTERNAL_ROUTES.TERMS_OF_SERVICE,
      external: true,
    },
    {
      name: 'Help Center',
      href: EXTERNAL_ROUTES.HELP_CENTER,
      external: true,
    },
  ],
  USER_MENU: [
    {
      name: 'Profile',
      href: ROUTES.USER_PROFILE,
      icon: 'User',
    },
    {
      name: 'Settings',
      href: ROUTES.SETTINGS,
      icon: 'Settings',
    },
  ],
} as const

// Route groups for access control
export const ROUTE_GROUPS = {
  PUBLIC: [
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ],
  PROTECTED: [
    ROUTES.DASHBOARD,
    ROUTES.ANALYTICS,
    ROUTES.USERS,
    ROUTES.USER_PROFILE,
    ROUTES.SETTINGS,
  ],
  ADMIN_ONLY: [
    ROUTES.USERS,
  ],
} as const