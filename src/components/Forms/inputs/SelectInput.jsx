import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../Forms.css';

/**
 * SelectInput - Enhanced select input with search, grouping, and custom rendering
 */
const SelectInput = forwardRef(({
  options = [],
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  size = 'medium',
  variant = 'default',
  groupBy,
  renderOption,
  renderValue,
  filterOption,
  noOptionsMessage = 'No options available',
  loadingMessage = 'Loading...',
  className = '',
  dropdownClassName = '',
  optionClassName = '',
  maxHeight = 200,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [internalValue, setInternalValue] = React.useState(multiple ? [] : value);
  
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Sync internal value with prop value
  React.useEffect(() => {
    setInternalValue(multiple ? (Array.isArray(value) ? value : []) : value);
  }, [value, multiple]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and group options
  const filteredOptions = React.useMemo(() => {
    let filtered = options;

    // Apply search filter
    if (searchable && searchTerm) {
      filtered = options.filter(option => {
        if (filterOption) {
          return filterOption(option, searchTerm);
        }
        const label = option.label || option.value || option;
        return label.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Group options if groupBy is provided
    if (groupBy) {
      const grouped = filtered.reduce((groups, option) => {
        const groupKey = typeof groupBy === 'function' ? groupBy(option) : option[groupBy];
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(option);
        return groups;
      }, {});

      return Object.entries(grouped).map(([group, items]) => ({
        group,
        options: items
      }));
    }

    return filtered;
  }, [options, searchTerm, searchable, filterOption, groupBy]);

  const selectClasses = [
    'select-input',
    `select-input--${size}`,
    `select-input--${variant}`,
    isOpen ? 'select-input--open' : '',
    disabled ? 'select-input--disabled' : '',
    multiple ? 'select-input--multiple' : '',
    className
  ].filter(Boolean).join(' ');

  const dropdownClasses = [
    'select-input__dropdown',
    dropdownClassName
  ].filter(Boolean).join(' ');

  const getOptionValue = (option) => {
    if (typeof option === 'object') {
      return option.value !== undefined ? option.value : option.label;
    }
    return option;
  };

  const getOptionLabel = (option) => {
    if (typeof option === 'object') {
      return option.label !== undefined ? option.label : option.value;
    }
    return option;
  };

  const isSelected = (option) => {
    const optionValue = getOptionValue(option);
    if (multiple) {
      return internalValue.includes(optionValue);
    }
    return internalValue === optionValue;
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleOptionSelect = (option) => {
    const optionValue = getOptionValue(option);
    let newValue;

    if (multiple) {
      if (isSelected(option)) {
        newValue = internalValue.filter(v => v !== optionValue);
      } else {
        newValue = [...internalValue, optionValue];
      }
    } else {
      newValue = optionValue;
      setIsOpen(false);
      setSearchTerm('');
    }

    setInternalValue(newValue);
    
    if (onChange) {
      onChange({
        target: { value: newValue, name: props.name },
        type: 'change'
      });
    }
  };

  const handleClear = (event) => {
    event.stopPropagation();
    const newValue = multiple ? [] : '';
    setInternalValue(newValue);
    
    if (onChange) {
      onChange({
        target: { value: newValue, name: props.name },
        type: 'change'
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const flatOptions = groupBy 
            ? filteredOptions.flatMap(group => group.options)
            : filteredOptions;
          if (flatOptions[highlightedIndex]) {
            handleOptionSelect(flatOptions[highlightedIndex]);
          }
        } else {
          handleToggle();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const flatOptions = groupBy 
            ? filteredOptions.flatMap(group => group.options)
            : filteredOptions;
          setHighlightedIndex(prev => 
            prev < flatOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const flatOptions = groupBy 
            ? filteredOptions.flatMap(group => group.options)
            : filteredOptions;
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : flatOptions.length - 1
          );
        }
        break;
    }
  };

  const renderSelectedValue = () => {
    if (multiple) {
      if (internalValue.length === 0) {
        return <span className="select-input__placeholder">{placeholder}</span>;
      }
      return (
        <div className="select-input__multi-value">
          {internalValue.map((val, index) => {
            const option = options.find(opt => getOptionValue(opt) === val);
            const label = option ? getOptionLabel(option) : val;
            return (
              <span key={index} className="select-input__tag">
                {renderValue ? renderValue(option || { value: val, label }) : label}
                <button
                  type="button"
                  className="select-input__tag-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionSelect(option || { value: val });
                  }}
                  aria-label={`Remove ${label}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      );
    } else {
      if (!internalValue) {
        return <span className="select-input__placeholder">{placeholder}</span>;
      }
      const option = options.find(opt => getOptionValue(opt) === internalValue);
      const label = option ? getOptionLabel(option) : internalValue;
      return renderValue ? renderValue(option || { value: internalValue, label }) : label;
    }
  };

  const renderOptions = () => {
    if (loading) {
      return (
        <div className="select-input__loading">
          {loadingMessage}
        </div>
      );
    }

    if (filteredOptions.length === 0) {
      return (
        <div className="select-input__no-options">
          {noOptionsMessage}
        </div>
      );
    }

    let optionIndex = 0;

    if (groupBy) {
      return filteredOptions.map((group, groupIndex) => (
        <div key={groupIndex} className="select-input__group">
          <div className="select-input__group-label">{group.group}</div>
          {group.options.map((option, index) => {
            const currentIndex = optionIndex++;
            const optionClasses = [
              'select-input__option',
              isSelected(option) ? 'select-input__option--selected' : '',
              highlightedIndex === currentIndex ? 'select-input__option--highlighted' : '',
              option.disabled ? 'select-input__option--disabled' : '',
              optionClassName
            ].filter(Boolean).join(' ');

            return (
              <div
                key={index}
                className={optionClasses}
                onClick={() => !option.disabled && handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(currentIndex)}
              >
                {renderOption ? renderOption(option) : getOptionLabel(option)}
              </div>
            );
          })}
        </div>
      ));
    } else {
      return filteredOptions.map((option, index) => {
        const optionClasses = [
          'select-input__option',
          isSelected(option) ? 'select-input__option--selected' : '',
          highlightedIndex === index ? 'select-input__option--highlighted' : '',
          option.disabled ? 'select-input__option--disabled' : '',
          optionClassName
        ].filter(Boolean).join(' ');

        return (
          <div
            key={index}
            className={optionClasses}
            onClick={() => !option.disabled && handleOptionSelect(option)}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            {renderOption ? renderOption(option) : getOptionLabel(option)}
          </div>
        );
      });
    }
  };

  const showClearButton = clearable && (
    (multiple && internalValue.length > 0) || 
    (!multiple && internalValue)
  ) && !disabled;

  return (
    <div 
      ref={containerRef}
      className={selectClasses}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div 
        className="select-input__control"
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <div className="select-input__value">
          {renderSelectedValue()}
        </div>

        <div className="select-input__indicators">
          {showClearButton && (
            <button
              type="button"
              className="select-input__clear"
              onClick={handleClear}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          
          <div className="select-input__dropdown-indicator">
            <span className={`select-input__arrow ${isOpen ? 'select-input__arrow--up' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={dropdownClasses}
          style={{ maxHeight }}
        >
          {searchable && (
            <div className="select-input__search">
              <input
                ref={inputRef}
                type="text"
                className="select-input__search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="select-input__options">
            {renderOptions()}
          </div>
        </div>
      )}
    </div>
  );
});

SelectInput.displayName = 'SelectInput';

SelectInput.propTypes = {
  options: PropTypes.array,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  searchable: PropTypes.bool,
  clearable: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'filled', 'outlined']),
  groupBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  renderOption: PropTypes.func,
  renderValue: PropTypes.func,
  filterOption: PropTypes.func,
  noOptionsMessage: PropTypes.string,
  loadingMessage: PropTypes.string,
  className: PropTypes.string,
  dropdownClassName: PropTypes.string,
  optionClassName: PropTypes.string,
  maxHeight: PropTypes.number,
  name: PropTypes.string
};

export default SelectInput;
