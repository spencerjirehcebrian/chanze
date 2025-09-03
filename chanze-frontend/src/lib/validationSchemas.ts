// Validation schema definitions using a simple validation approach
// In a real app, you might use Zod, Yup, or similar

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

// Common validation rules
export const validationRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address'
      }
      return null
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return 'Password is required'
      if (value.length < 8) return 'Password must be at least 8 characters'
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter'
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter'
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number'
      return null
    }
  },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (!value) return 'Please confirm your password'
      if (value !== password) return 'Passwords do not match'
      return null
    }
  }),
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    custom: (value: string) => {
      if (!value) return 'Name is required'
      if (value.length < 2) return 'Name must be at least 2 characters'
      if (value.length > 50) return 'Name must be less than 50 characters'
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces'
      return null
    }
  }
}

// Validation schemas for different forms
export const authSchemas = {
  login: {
    email: validationRules.email,
    password: validationRules.required
  },
  register: {
    email: validationRules.email,
    password: validationRules.password,
    confirmPassword: validationRules.confirmPassword
  },
  forgotPassword: {
    email: validationRules.email
  },
  resetPassword: {
    password: validationRules.password,
    confirmPassword: validationRules.confirmPassword
  }
} as const

export const profileSchemas = {
  updateProfile: {
    email: validationRules.email,
    firstName: { ...validationRules.name, required: false },
    lastName: { ...validationRules.name, required: false }
  },
  changePassword: {
    currentPassword: validationRules.required,
    newPassword: validationRules.password,
    confirmPassword: validationRules.confirmPassword
  }
} as const

// Validation function
export function validateField(value: any, rule: ValidationRule): string | null {
  // Check required
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required'
  }
  
  // Skip other validations if field is empty and not required
  if (!value && !rule.required) {
    return null
  }
  
  // Check minLength
  if (rule.minLength && value.length < rule.minLength) {
    return `Must be at least ${rule.minLength} characters`
  }
  
  // Check maxLength
  if (rule.maxLength && value.length > rule.maxLength) {
    return `Must be less than ${rule.maxLength} characters`
  }
  
  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    return 'Invalid format'
  }
  
  // Check custom validation
  if (rule.custom) {
    return rule.custom(value)
  }
  
  return null
}

export function validateForm(data: Record<string, any>, schema: ValidationSchema): ValidationErrors {
  const errors: ValidationErrors = {}
  
  for (const [field, rule] of Object.entries(schema)) {
    const error = validateField(data[field], rule)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

// Hook for form validation
export function useFormValidation(schema: ValidationSchema) {
  const validate = (data: Record<string, any>) => {
    return validateForm(data, schema)
  }
  
  const validateField = (field: string, value: any) => {
    const rule = schema[field]
    if (!rule) return null
    return validateField(value, rule)
  }
  
  return { validate, validateField }
}