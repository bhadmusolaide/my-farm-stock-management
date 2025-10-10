import React from 'react';
import PropTypes from 'prop-types';
import '../Forms.css';

/**
 * ErrorMessage - Displays validation errors with consistent styling and accessibility
 */
const ErrorMessage = ({
  error,
  errors = [],
  show = true,
  variant = 'default', // default, inline, tooltip, banner
  icon = true,
  dismissible = false,
  onDismiss,
  className = '',
  id,
  ...props
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Normalize errors to array
  const errorList = React.useMemo(() => {
    if (!error && errors.length === 0) return [];
    
    if (error) {
      return Array.isArray(error) ? error : [error];
    }
    
    return errors;
  }, [error, errors]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if no errors, not shown, or dismissed
  if (errorList.length === 0 || !show || isDismissed) {
    return null;
  }

  const errorClasses = [
    'error-message',
    `error-message--${variant}`,
    dismissible ? 'error-message--dismissible' : '',
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconElement = typeof icon === 'boolean' ? '⚠' : icon;
    
    return (
      <span className="error-message__icon" aria-hidden="true">
        {iconElement}
      </span>
    );
  };

  const renderErrors = () => {
    if (errorList.length === 1) {
      return (
        <span className="error-message__text">
          {errorList[0]}
        </span>
      );
    }

    return (
      <ul className="error-message__list">
        {errorList.map((err, index) => (
          <li key={index} className="error-message__item">
            {err}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div 
      id={id}
      className={errorClasses}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="error-message__content">
        {renderIcon()}
        {renderErrors()}
      </div>
      
      {dismissible && (
        <button
          type="button"
          className="error-message__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * FieldError - Specialized error message for form fields
 */
export const FieldError = ({
  name,
  form,
  ...props
}) => {
  const error = form?.errors?.[name];
  const touched = form?.touched?.[name];
  
  return (
    <ErrorMessage
      error={error}
      show={touched && !!error}
      variant="inline"
      {...props}
    />
  );
};

/**
 * FormError - Error message for form-level errors
 */
export const FormError = ({
  form,
  ...props
}) => {
  const hasErrors = form?.errors && Object.keys(form.errors).length > 0;
  const errorList = hasErrors ? Object.values(form.errors) : [];
  
  return (
    <ErrorMessage
      errors={errorList}
      show={hasErrors && form?.submitCount > 0}
      variant="banner"
      dismissible
      {...props}
    />
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]),
  errors: PropTypes.array,
  show: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'inline', 'tooltip', 'banner']),
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string
};

FieldError.propTypes = {
  name: PropTypes.string.isRequired,
  form: PropTypes.object
};

FormError.propTypes = {
  form: PropTypes.object
};

export default ErrorMessage;
