import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../Forms.css';

/**
 * TextInput - Enhanced text input with validation, icons, and formatting
 */
const TextInput = forwardRef(({
  type = 'text',
  placeholder,
  value = '',
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  readOnly = false,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  size = 'medium', // small, medium, large
  variant = 'default', // default, filled, outlined
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  clearable = false,
  onClear,
  loading = false,
  className = '',
  inputClassName = '',
  error = false,
  success = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value);

  // Sync internal value with prop value
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const inputClasses = [
    'text-input',
    `text-input--${size}`,
    `text-input--${variant}`,
    isFocused ? 'text-input--focused' : '',
    disabled ? 'text-input--disabled' : '',
    readOnly ? 'text-input--readonly' : '',
    error ? 'text-input--error' : '',
    success ? 'text-input--success' : '',
    loading ? 'text-input--loading' : '',
    leftIcon ? 'text-input--has-left-icon' : '',
    rightIcon || clearable ? 'text-input--has-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  const inputFieldClasses = [
    'text-input__field',
    inputClassName
  ].filter(Boolean).join(' ');

  const handleChange = (event) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (event) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  const handleClear = () => {
    const syntheticEvent = {
      target: { value: '', name: props.name },
      type: 'change'
    };
    setInternalValue('');
    if (onChange) {
      onChange(syntheticEvent);
    }
    if (onClear) {
      onClear();
    }
  };

  const showClearButton = clearable && internalValue && !disabled && !readOnly;

  return (
    <div className={inputClasses}>
      {leftIcon && (
        <div 
          className="text-input__left-icon"
          onClick={onLeftIconClick}
          role={onLeftIconClick ? 'button' : undefined}
          tabIndex={onLeftIconClick ? 0 : undefined}
          aria-label={onLeftIconClick ? 'Left icon action' : undefined}
        >
          {leftIcon}
        </div>
      )}

      <input
        ref={ref}
        type={type}
        className={inputFieldClasses}
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        aria-invalid={error}
        {...props}
      />

      {loading && (
        <div className="text-input__loading">
          <span className="text-input__spinner">⟳</span>
        </div>
      )}

      {showClearButton && (
        <button
          type="button"
          className="text-input__clear-button"
          onClick={handleClear}
          aria-label="Clear input"
          tabIndex={-1}
        >
          ✕
        </button>
      )}

      {rightIcon && !showClearButton && !loading && (
        <div 
          className="text-input__right-icon"
          onClick={onRightIconClick}
          role={onRightIconClick ? 'button' : undefined}
          tabIndex={onRightIconClick ? 0 : undefined}
          aria-label={onRightIconClick ? 'Right icon action' : undefined}
        >
          {rightIcon}
        </div>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';

TextInput.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'password', 'url', 'tel', 'search']),
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  pattern: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'filled', 'outlined']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onLeftIconClick: PropTypes.func,
  onRightIconClick: PropTypes.func,
  clearable: PropTypes.bool,
  onClear: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  error: PropTypes.bool,
  success: PropTypes.bool,
  name: PropTypes.string
};

export default TextInput;
