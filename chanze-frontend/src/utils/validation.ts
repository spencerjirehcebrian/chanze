// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Phone number validation (basic)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

// Credit card validation (Luhn algorithm)
export function isValidCreditCard(cardNumber: string): boolean {
  const num = cardNumber.replace(/\D/g, '')
  if (num.length < 13 || num.length > 19) return false
  
  let sum = 0
  let isEven = false
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString)
  return date < new Date()
}

export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString)
  return date > new Date()
}

// String validation helpers
export function isAlphabetic(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str)
}

export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str)
}

export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str)
}

export function hasMinLength(str: string, min: number): boolean {
  return str.length >= min
}

export function hasMaxLength(str: string, max: number): boolean {
  return str.length <= max
}

export function isInRange(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max
}

// File validation
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

// Password validation utilities
export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password)
}

export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password)
}

export function hasNumbers(password: string): boolean {
  return /\d/.test(password)
}

export function hasSpecialChars(password: string): boolean {
  return /[@$!%*?&]/.test(password)
}

// Form validation utilities
export interface ValidationRule<T = any> {
  validator: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateField<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = []
  
  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule<T[keyof T]>[]>
): Record<keyof T, ValidationResult> {
  const results = {} as Record<keyof T, ValidationResult>
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field as keyof T]
    results[field as keyof T] = validateField(value, fieldRules as ValidationRule<any>[])
  }
  
  return results
}

// Common validation rules
export const validationRules = {
  required: <T>(value: T): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    return true
  },
  
  email: (value: string): boolean => isValidEmail(value),
  
  minLength: (min: number) => (value: string): boolean => hasMinLength(value, min),
  
  maxLength: (max: number) => (value: string): boolean => hasMaxLength(value, max),
  
  pattern: (regex: RegExp) => (value: string): boolean => regex.test(value),
  
  numeric: (value: string): boolean => isNumeric(value),
  
  alphabetic: (value: string): boolean => isAlphabetic(value),
  
  alphanumeric: (value: string): boolean => isAlphanumeric(value),
  
  url: (value: string): boolean => isValidUrl(value),
  
  phone: (value: string): boolean => isValidPhoneNumber(value),
  
  positiveNumber: (value: number): boolean => value > 0,
  
  nonNegativeNumber: (value: number): boolean => value >= 0,
  
  dateInFuture: (value: string): boolean => isValidDate(value) && isDateInFuture(value),
  
  dateInPast: (value: string): boolean => isValidDate(value) && isDateInPast(value),
}

// Sanitization utilities
export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}