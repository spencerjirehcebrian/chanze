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
  
  // Settings
  SETTINGS: '/settings',
  USER_PROFILE: '/profile',
  
  // Error pages
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
} as const

// External routes
export const EXTERNAL_ROUTES = {
  PRIVACY_POLICY: '/privacy',
  TERMS_OF_SERVICE: '/terms',
  HELP_CENTER: '/help',
  CONTACT: '/contact',
} as const

// API route patterns (for server-side routing)
export const API_ROUTES = {
  AUTH: '/api/auth/*',
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
    ROUTES.USER_PROFILE,
    ROUTES.SETTINGS,
  ],
} as const