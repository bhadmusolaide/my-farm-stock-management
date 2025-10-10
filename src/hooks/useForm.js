import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for form state management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Configuration options
 * @returns {Object} - Form state and handlers
 */
export function useForm(initialValues = {}, options = {}) {
  const {
    validationSchema,
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
    resetOnSubmit = false
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const validateField = useCallback((name, value) => {
    if (!validationSchema || !validationSchema[name]) return null;

    const validator = validationSchema[name];
    if (typeof validator === 'function') {
      return validator(value, values);
    }

    // Handle validation rules object
    if (typeof validator === 'object') {
      const { required, minLength, maxLength, pattern, custom } = validator;

      if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return validator.requiredMessage || `${name} is required`;
      }

      if (value && minLength && value.length < minLength) {
        return validator.minLengthMessage || `${name} must be at least ${minLength} characters`;
      }

      if (value && maxLength && value.length > maxLength) {
        return validator.maxLengthMessage || `${name} must be no more than ${maxLength} characters`;
      }

      if (value && pattern && !pattern.test(value)) {
        return validator.patternMessage || `${name} format is invalid`;
      }

      if (custom && typeof custom === 'function') {
        return custom(value, values);
      }
    }

    return null;
  }, [validationSchema, values]);

  const validateForm = useCallback(() => {
    if (!validationSchema) return {};

    const newErrors = {};
    Object.keys(validationSchema).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });

    return newErrors;
  }, [validationSchema, validateField, values]);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else if (errors[name]) {
      // Clear error if field was previously invalid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validateField, validateOnChange, errors]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateField, validateOnBlur, values]);

  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    setSubmitCount(prev => prev + 1);
    setIsSubmitting(true);

    // Validate all fields
    const formErrors = validateForm();
    setErrors(formErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    try {
      if (Object.keys(formErrors).length === 0) {
        if (onSubmit) {
          await onSubmit(values);
        }
        
        if (resetOnSubmit) {
          reset();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, resetOnSubmit]);

  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: touched[name] && errors[name],
    'aria-invalid': touched[name] && !!errors[name]
  }), [values, handleChange, handleBlur, touched, errors]);

  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    getFieldProps,
    validateForm
  };
}

/**
 * Custom hook for form persistence to localStorage
 * @param {string} key - localStorage key
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Configuration options
 * @returns {Object} - Form state with persistence
 */
export function useFormPersistence(key, initialValues = {}, options = {}) {
  const { debounceMs = 500, clearOnSubmit = true } = options;
  const debounceRef = useRef(null);

  // Load persisted values on mount
  const getPersistedValues = useCallback(() => {
    try {
      const persisted = localStorage.getItem(key);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return { ...initialValues, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }
    return initialValues;
  }, [key, initialValues]);

  const [values, setValues] = useState(getPersistedValues);

  // Debounced save to localStorage
  const saveToStorage = useCallback((formValues) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(formValues));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }, debounceMs);
  }, [key, debounceMs]);

  const updateValues = useCallback((newValues) => {
    setValues(newValues);
    saveToStorage(newValues);
  }, [saveToStorage]);

  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear persisted form data:', error);
    }
  }, [key]);

  const handleSubmit = useCallback(async (submitHandler) => {
    try {
      await submitHandler(values);
      if (clearOnSubmit) {
        clearPersistedData();
      }
    } catch (error) {
      throw error;
    }
  }, [values, clearOnSubmit, clearPersistedData]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    values,
    updateValues,
    clearPersistedData,
    handleSubmit
  };
}

/**
 * Custom hook for multi-step form management
 * @param {Array} steps - Array of step configurations
 * @param {Object} options - Configuration options
 * @returns {Object} - Multi-step form state and controls
 */
export function useMultiStepForm(steps = [], options = {}) {
  const { initialStep = 0, persistKey } = options;
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepData, setStepData] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [errors, setErrors] = useState({});

  // Load persisted data if key provided
  useEffect(() => {
    if (persistKey) {
      try {
        const persisted = localStorage.getItem(persistKey);
        if (persisted) {
          const { stepData: persistedData, currentStep: persistedStep, completedSteps: persistedCompleted } = JSON.parse(persisted);
          setStepData(persistedData || {});
          setCurrentStep(persistedStep || initialStep);
          setCompletedSteps(new Set(persistedCompleted || []));
        }
      } catch (error) {
        console.warn('Failed to load persisted multi-step form data:', error);
      }
    }
  }, [persistKey, initialStep]);

  // Persist data when it changes
  useEffect(() => {
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, JSON.stringify({
          stepData,
          currentStep,
          completedSteps: Array.from(completedSteps)
        }));
      } catch (error) {
        console.warn('Failed to persist multi-step form data:', error);
      }
    }
  }, [persistKey, stepData, currentStep, completedSteps]);

  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  }, []);

  const validateStep = useCallback((step) => {
    const stepConfig = steps[step];
    if (!stepConfig || !stepConfig.validate) return true;

    const stepValues = stepData[step] || {};
    const stepErrors = stepConfig.validate(stepValues, stepData);
    
    if (stepErrors && Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, [step]: stepErrors }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[step];
        return newErrors;
      });
      return true;
    }
  }, [steps, stepData]);

  const goToStep = useCallback((step) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return true;
    }
    return false;
  }, [currentStep, steps.length, validateStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setStepData({});
    setCompletedSteps(new Set());
    setErrors({});
    
    if (persistKey) {
      try {
        localStorage.removeItem(persistKey);
      } catch (error) {
        console.warn('Failed to clear persisted multi-step form data:', error);
      }
    }
  }, [initialStep, persistKey]);

  const getAllData = useCallback(() => {
    return Object.values(stepData).reduce((acc, data) => ({ ...acc, ...data }), {});
  }, [stepData]);

  const isStepValid = useCallback((step) => {
    return !errors[step] || Object.keys(errors[step]).length === 0;
  }, [errors]);

  const canGoNext = currentStep < steps.length - 1;
  const canGoPrevious = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return {
    currentStep,
    stepData,
    completedSteps,
    errors,
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    currentStepData: stepData[currentStep] || {},
    currentStepErrors: errors[currentStep] || {},
    updateStepData,
    goToStep,
    nextStep,
    previousStep,
    reset,
    getAllData,
    validateStep,
    isStepValid
  };
}
