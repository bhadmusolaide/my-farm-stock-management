// Validation utilities for form inputs

// Individual validators
export const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  minLength: (min) => (value) => {
    if (!value) return null
    if (value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return null
  },

  maxLength: (max) => (value) => {
    if (!value) return null
    if (value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return null
  },

  number: (value) => {
    if (!value) return null
    if (isNaN(Number(value))) {
      return 'Must be a valid number'
    }
    return null
  },

  positiveNumber: (value) => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number'
    }
    return null
  },

  nonNegativeNumber: (value) => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num) || num < 0) {
      return 'Must be a non-negative number'
    }
    return null
  },

  integer: (value) => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num) || !Number.isInteger(num)) {
      return 'Must be a whole number'
    }
    return null
  },

  positiveInteger: (value) => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
      return 'Must be a positive whole number'
    }
    return null
  },

  phone: (value) => {
    if (!value) return null
    // Basic phone validation - adjust regex based on your requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  date: (value) => {
    if (!value) return null
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date'
    }
    return null
  },

  futureDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date <= today) {
      return 'Date must be in the future'
    }
    return null
  },

  pastDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date >= today) {
      return 'Date must be in the past'
    }
    return null
  }
}

// Validate a single field with multiple validators
export const validateField = (value, validatorList) => {
  for (const validator of validatorList) {
    const error = validator(value)
    if (error) {
      return error
    }
  }
  return null
}

// Validate an entire form
export const validateForm = (formData, validationRules) => {
  const errors = {}
  let isValid = true

  for (const [fieldName, validators] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName]
    const error = validateField(fieldValue, validators)
    
    if (error) {
      errors[fieldName] = error
      isValid = false
    }
  }

  return { isValid, errors }
}

// Common validation rule sets
export const commonRules = {
  email: [validators.required, validators.email],
  password: [validators.required, validators.minLength(6)],
  name: [validators.required, validators.minLength(2), validators.maxLength(50)],
  phone: [validators.phone],
  requiredText: [validators.required],
  requiredNumber: [validators.required, validators.number],
  positiveNumber: [validators.required, validators.positiveNumber],
  positiveInteger: [validators.required, validators.positiveInteger],
  nonNegativeNumber: [validators.required, validators.nonNegativeNumber],
  optionalEmail: [validators.email],
  optionalPhone: [validators.phone]
}

// Chicken order specific validation rules
export const chickenOrderRules = {
  customer: commonRules.name,
  location: commonRules.requiredText,
  count: commonRules.positiveInteger,
  size: commonRules.positiveNumber,
  price: commonRules.positiveNumber,
  amountPaid: commonRules.nonNegativeNumber,
  phone: commonRules.optionalPhone,
  status: commonRules.requiredText
}

// Stock item validation rules
export const stockItemRules = {
  name: commonRules.name,
  category: commonRules.requiredText,
  quantity: commonRules.nonNegativeNumber,
  unit: commonRules.requiredText,
  price: commonRules.positiveNumber,
  supplier: commonRules.requiredText
}

// Transaction validation rules
export const transactionRules = {
  type: commonRules.requiredText,
  amount: commonRules.positiveNumber,
  description: commonRules.requiredText,
  category: commonRules.requiredText
}

// User validation rules
export const userRules = {
  email: commonRules.email,
  full_name: commonRules.name,
  role: commonRules.requiredText
}

// Helper function to get error message for a field
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName] || null
}

// Helper function to check if a field has an error
export const hasFieldError = (errors, fieldName) => {
  return !!errors[fieldName]
}