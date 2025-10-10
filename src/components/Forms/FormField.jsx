import React from 'react';
import PropTypes from 'prop-types';
import './Forms.css';

/**
 * FormField - Base form field component with label, error handling, and help text
 */
const FormField = ({
  label,
  name,
  required = false,
  error,
  helpText,
  children,
  className = '',
  labelClassName = '',
  errorClassName = '',
  helpClassName = '',
  inline = false,
  disabled = false,
  ...props
}) => {
  const fieldId = props.id || `field-${name}`;
  const hasError = !!error;
  
  const fieldClasses = [
    'form-field',
    inline ? 'form-field--inline' : 'form-field--stacked',
    hasError ? 'form-field--error' : '',
    disabled ? 'form-field--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'form-field__label',
    required ? 'form-field__label--required' : '',
    labelClassName
  ].filter(Boolean).join(' ');

  const errorClasses = [
    'form-field__error',
    errorClassName
  ].filter(Boolean).join(' ');

  const helpClasses = [
    'form-field__help',
    helpClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={fieldClasses} {...props}>
      {label && (
        <label 
          htmlFor={fieldId} 
          className={labelClasses}
          aria-label={label}
        >
          {label}
          {required && <span className="form-field__required-indicator" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="form-field__input-wrapper">
        {React.cloneElement(children, {
          id: fieldId,
          name: name,
          'aria-invalid': hasError,
          'aria-describedby': error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined,
          disabled: disabled,
          ...children.props
        })}
      </div>

      {error && (
        <div 
          id={`${fieldId}-error`}
          className={errorClasses}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {helpText && !error && (
        <div 
          id={`${fieldId}-help`}
          className={helpClasses}
        >
          {helpText}
        </div>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  children: PropTypes.element.isRequired,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpClassName: PropTypes.string,
  inline: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string
};

export default FormField;
