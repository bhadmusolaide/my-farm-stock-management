import React from 'react';
import PropTypes from 'prop-types';

/**
 * FieldValidator - Higher-order component that adds validation to form fields
 */
const FieldValidator = ({
  children,
  name,
  value,
  rules = {},
  customValidator,
  validateOnChange = false,
  validateOnBlur = true,
  validateOnMount = false,
  onValidation,
  dependencies = [],
  ...props
}) => {
  const [error, setError] = React.useState(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [hasValidated, setHasValidated] = React.useState(false);

  // Validation rules
  const validateField = React.useCallback(async (fieldValue, allValues = {}) => {
    setIsValidating(true);
    
    try {
      // Required validation
      if (rules.required && (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === ''))) {
        const message = typeof rules.required === 'string' ? rules.required : `${name} is required`;
        setError(message);
        return message;
      }

      // Skip other validations if field is empty and not required
      if (!fieldValue && !rules.required) {
        setError(null);
        return null;
      }

      // Min length validation
      if (rules.minLength && fieldValue.length < rules.minLength) {
        const message = rules.minLengthMessage || `${name} must be at least ${rules.minLength} characters`;
        setError(message);
        return message;
      }

      // Max length validation
      if (rules.maxLength && fieldValue.length > rules.maxLength) {
        const message = rules.maxLengthMessage || `${name} must be no more than ${rules.maxLength} characters`;
        setError(message);
        return message;
      }

      // Min value validation (for numbers)
      if (rules.min !== undefined && Number(fieldValue) < rules.min) {
        const message = rules.minMessage || `${name} must be at least ${rules.min}`;
        setError(message);
        return message;
      }

      // Max value validation (for numbers)
      if (rules.max !== undefined && Number(fieldValue) > rules.max) {
        const message = rules.maxMessage || `${name} must be no more than ${rules.max}`;
        setError(message);
        return message;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(fieldValue)) {
        const message = rules.patternMessage || `${name} format is invalid`;
        setError(message);
        return message;
      }

      // Email validation
      if (rules.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(fieldValue)) {
          const message = rules.emailMessage || `${name} must be a valid email address`;
          setError(message);
          return message;
        }
      }

      // URL validation
      if (rules.url) {
        try {
          new URL(fieldValue);
        } catch {
          const message = rules.urlMessage || `${name} must be a valid URL`;
          setError(message);
          return message;
        }
      }

      // Number validation
      if (rules.number && isNaN(Number(fieldValue))) {
        const message = rules.numberMessage || `${name} must be a valid number`;
        setError(message);
        return message;
      }

      // Integer validation
      if (rules.integer && !Number.isInteger(Number(fieldValue))) {
        const message = rules.integerMessage || `${name} must be a whole number`;
        setError(message);
        return message;
      }

      // Custom validation function
      if (rules.custom && typeof rules.custom === 'function') {
        const customResult = await rules.custom(fieldValue, allValues);
        if (customResult) {
          setError(customResult);
          return customResult;
        }
      }

      // External custom validator
      if (customValidator && typeof customValidator === 'function') {
        const customResult = await customValidator(fieldValue, allValues);
        if (customResult) {
          setError(customResult);
          return customResult;
        }
      }

      // If we get here, validation passed
      setError(null);
      return null;

    } catch (validationError) {
      const message = validationError.message || 'Validation error occurred';
      setError(message);
      return message;
    } finally {
      setIsValidating(false);
      setHasValidated(true);
    }
  }, [name, rules, customValidator]);

  // Validate on mount if required
  React.useEffect(() => {
    if (validateOnMount && value !== undefined) {
      validateField(value);
    }
  }, [validateOnMount, validateField, value]);

  // Validate when dependencies change
  React.useEffect(() => {
    if (hasValidated && dependencies.length > 0) {
      validateField(value);
    }
  }, dependencies);

  // Report validation results
  React.useEffect(() => {
    if (onValidation && hasValidated) {
      onValidation(name, error, isValidating);
    }
  }, [name, error, isValidating, onValidation, hasValidated]);

  const handleChange = async (event) => {
    const newValue = event.target.value;
    
    // Call original onChange
    if (children.props.onChange) {
      children.props.onChange(event);
    }

    // Validate on change if enabled
    if (validateOnChange) {
      await validateField(newValue);
    } else if (error) {
      // Clear error if field was previously invalid
      setError(null);
    }
  };

  const handleBlur = async (event) => {
    // Call original onBlur
    if (children.props.onBlur) {
      children.props.onBlur(event);
    }

    // Validate on blur if enabled
    if (validateOnBlur) {
      await validateField(event.target.value);
    }
  };

  // Clone child element with validation props
  return React.cloneElement(children, {
    ...children.props,
    onChange: handleChange,
    onBlur: handleBlur,
    error: error,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : children.props['aria-describedby'],
    ...props
  });
};

/**
 * ValidationProvider - Context provider for form-level validation
 */
export const ValidationContext = React.createContext({
  errors: {},
  isValidating: false,
  validateField: () => {},
  clearFieldError: () => {},
  clearAllErrors: () => {}
});

export const ValidationProvider = ({ children, onValidationChange }) => {
  const [errors, setErrors] = React.useState({});
  const [validatingFields, setValidatingFields] = React.useState(new Set());

  const validateField = React.useCallback(async (name, value, validator) => {
    setValidatingFields(prev => new Set([...prev, name]));
    
    try {
      const error = await validator(value);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
      
      return error;
    } finally {
      setValidatingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  }, []);

  const clearFieldError = React.useCallback((name) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors({});
    setValidatingFields(new Set());
  }, []);

  const contextValue = React.useMemo(() => ({
    errors,
    isValidating: validatingFields.size > 0,
    validateField,
    clearFieldError,
    clearAllErrors
  }), [errors, validatingFields.size, validateField, clearFieldError, clearAllErrors]);

  // Notify parent of validation changes
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(errors, validatingFields.size > 0);
    }
  }, [errors, validatingFields.size, onValidationChange]);

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
};

/**
 * useValidation - Hook to access validation context
 */
export const useValidation = () => {
  const context = React.useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

FieldValidator.propTypes = {
  children: PropTypes.element.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  rules: PropTypes.object,
  customValidator: PropTypes.func,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  validateOnMount: PropTypes.bool,
  onValidation: PropTypes.func,
  dependencies: PropTypes.array
};

ValidationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onValidationChange: PropTypes.func
};

export default FieldValidator;
