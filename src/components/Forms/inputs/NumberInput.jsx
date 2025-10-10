import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import TextInput from './TextInput';
import '../Forms.css';

/**
 * NumberInput - Enhanced number input with formatting, validation, and controls
 */
const NumberInput = forwardRef(({
  value = '',
  onChange,
  min,
  max,
  step = 1,
  precision = 0,
  allowNegative = true,
  allowDecimal = true,
  thousandSeparator = ',',
  decimalSeparator = '.',
  prefix = '',
  suffix = '',
  showControls = false,
  controlsPosition = 'right', // right, left
  formatOnBlur = true,
  parseOnFocus = false,
  className = '',
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Format number for display
  const formatNumber = React.useCallback((num) => {
    if (num === '' || num === null || num === undefined) return '';
    
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '';

    let formatted = numValue.toFixed(precision);
    
    if (thousandSeparator && !isFocused) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
      formatted = parts.join(decimalSeparator);
    }

    return `${prefix}${formatted}${suffix}`;
  }, [precision, thousandSeparator, decimalSeparator, prefix, suffix, isFocused]);

  // Parse display value to number
  const parseNumber = React.useCallback((str) => {
    if (!str) return '';
    
    // Remove prefix, suffix, and thousand separators
    let cleaned = str.replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
    cleaned = cleaned.replace(new RegExp(`${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
    cleaned = cleaned.replace(new RegExp(thousandSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    cleaned = cleaned.replace(decimalSeparator, '.');
    
    return cleaned;
  }, [prefix, suffix, thousandSeparator, decimalSeparator]);

  // Update display value when value prop changes
  React.useEffect(() => {
    if (isFocused && parseOnFocus) {
      setDisplayValue(parseNumber(value.toString()));
    } else {
      setDisplayValue(formatNumber(value));
    }
  }, [value, formatNumber, parseNumber, isFocused, parseOnFocus]);

  const validateNumber = (numStr) => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return false;
    
    if (!allowNegative && num < 0) return false;
    if (!allowDecimal && num % 1 !== 0) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    
    return true;
  };

  const handleChange = (event) => {
    const inputValue = event.target.value;
    const parsed = parseNumber(inputValue);
    
    // Allow empty value
    if (parsed === '') {
      setDisplayValue(inputValue);
      if (onChange) {
        onChange({ ...event, target: { ...event.target, value: '' } });
      }
      return;
    }

    // Validate input pattern
    const numberPattern = allowDecimal 
      ? new RegExp(`^${allowNegative ? '-?' : ''}\\d*\\.?\\d*$`)
      : new RegExp(`^${allowNegative ? '-?' : ''}\\d*$`);
    
    if (numberPattern.test(parsed)) {
      setDisplayValue(inputValue);
      
      // Only call onChange if it's a valid number
      if (validateNumber(parsed)) {
        const numValue = parseFloat(parsed);
        if (onChange) {
          onChange({ ...event, target: { ...event.target, value: numValue } });
        }
      }
    }
  };

  const handleFocus = (event) => {
    setIsFocused(true);
    if (parseOnFocus) {
      const parsed = parseNumber(displayValue);
      setDisplayValue(parsed);
    }
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    
    if (formatOnBlur) {
      const parsed = parseNumber(displayValue);
      if (parsed && validateNumber(parsed)) {
        const formatted = formatNumber(parseFloat(parsed));
        setDisplayValue(formatted);
      }
    }
    
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(parseNumber(displayValue)) || 0;
    const newValue = current + step;
    
    if (max === undefined || newValue <= max) {
      const formatted = formatNumber(newValue);
      setDisplayValue(formatted);
      
      if (onChange) {
        onChange({
          target: { value: newValue, name: props.name },
          type: 'change'
        });
      }
    }
  };

  const handleDecrement = () => {
    const current = parseFloat(parseNumber(displayValue)) || 0;
    const newValue = current - step;
    
    if (min === undefined || newValue >= min) {
      const formatted = formatNumber(newValue);
      setDisplayValue(formatted);
      
      if (onChange) {
        onChange({
          target: { value: newValue, name: props.name },
          type: 'change'
        });
      }
    }
  };

  const numberInputClasses = [
    'number-input',
    showControls ? 'number-input--with-controls' : '',
    `number-input--controls-${controlsPosition}`,
    className
  ].filter(Boolean).join(' ');

  const controls = showControls && (
    <div className="number-input__controls">
      <button
        type="button"
        className="number-input__control number-input__increment"
        onClick={handleIncrement}
        disabled={props.disabled || (max !== undefined && parseFloat(parseNumber(displayValue)) >= max)}
        aria-label="Increment"
        tabIndex={-1}
      >
        ▲
      </button>
      <button
        type="button"
        className="number-input__control number-input__decrement"
        onClick={handleDecrement}
        disabled={props.disabled || (min !== undefined && parseFloat(parseNumber(displayValue)) <= min)}
        aria-label="Decrement"
        tabIndex={-1}
      >
        ▼
      </button>
    </div>
  );

  return (
    <div className={numberInputClasses}>
      <TextInput
        ref={ref}
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputMode="numeric"
        leftIcon={controlsPosition === 'left' ? controls : props.leftIcon}
        rightIcon={controlsPosition === 'right' ? controls : props.rightIcon}
        className=""
      />
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

NumberInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  precision: PropTypes.number,
  allowNegative: PropTypes.bool,
  allowDecimal: PropTypes.bool,
  thousandSeparator: PropTypes.string,
  decimalSeparator: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  showControls: PropTypes.bool,
  controlsPosition: PropTypes.oneOf(['left', 'right']),
  formatOnBlur: PropTypes.bool,
  parseOnFocus: PropTypes.bool,
  className: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node
};

export default NumberInput;
