import React from 'react';
import PropTypes from 'prop-types';
import '../Forms.css';

/**
 * ValidationSummary - Displays a summary of all validation errors in a form
 */
const ValidationSummary = ({
  form,
  errors = {},
  title = 'Please correct the following errors:',
  showFieldNames = true,
  showOnlyTouched = true,
  groupByField = false,
  maxErrors = 10,
  variant = 'default', // default, compact, detailed
  severity = 'error', // error, warning, info
  dismissible = false,
  onDismiss,
  onErrorClick,
  className = '',
  ...props
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Get errors from form or props
  const formErrors = form?.errors || errors;
  const touched = form?.touched || {};

  // Process errors
  const processedErrors = React.useMemo(() => {
    const errorEntries = Object.entries(formErrors);
    
    // Filter by touched fields if required
    const filteredEntries = showOnlyTouched 
      ? errorEntries.filter(([field]) => touched[field])
      : errorEntries;

    // Limit number of errors
    const limitedEntries = filteredEntries.slice(0, maxErrors);

    if (groupByField) {
      return limitedEntries.map(([field, error]) => ({
        field,
        errors: Array.isArray(error) ? error : [error]
      }));
    } else {
      return limitedEntries.flatMap(([field, error]) => {
        const errorList = Array.isArray(error) ? error : [error];
        return errorList.map(err => ({
          field,
          error: err,
          displayText: showFieldNames ? `${field}: ${err}` : err
        }));
      });
    }
  }, [formErrors, touched, showOnlyTouched, maxErrors, groupByField, showFieldNames]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleErrorClick = (field, error) => {
    if (onErrorClick) {
      onErrorClick(field, error);
    } else {
      // Default behavior: focus the field
      const fieldElement = document.querySelector(`[name="${field}"], #field-${field}`);
      if (fieldElement) {
        fieldElement.focus();
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Don't render if no errors or dismissed
  if (processedErrors.length === 0 || isDismissed) {
    return null;
  }

  const summaryClasses = [
    'validation-summary',
    `validation-summary--${variant}`,
    `validation-summary--${severity}`,
    dismissible ? 'validation-summary--dismissible' : '',
    className
  ].filter(Boolean).join(' ');

  const renderCompactView = () => (
    <div className="validation-summary__compact">
      <div className="validation-summary__header">
        <span className="validation-summary__icon">⚠</span>
        <span className="validation-summary__count">
          {processedErrors.length} error{processedErrors.length !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="validation-summary__detailed">
      {title && (
        <div className="validation-summary__title">
          <span className="validation-summary__icon">⚠</span>
          {title}
        </div>
      )}
      
      <div className="validation-summary__content">
        {groupByField ? (
          <div className="validation-summary__groups">
            {processedErrors.map(({ field, errors }, index) => (
              <div key={index} className="validation-summary__group">
                <div className="validation-summary__field-name">
                  {field}:
                </div>
                <ul className="validation-summary__field-errors">
                  {errors.map((error, errorIndex) => (
                    <li 
                      key={errorIndex}
                      className="validation-summary__error-item"
                      onClick={() => handleErrorClick(field, error)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleErrorClick(field, error);
                        }
                      }}
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="validation-summary__errors">
            {processedErrors.map(({ field, error, displayText }, index) => (
              <li 
                key={index}
                className="validation-summary__error-item"
                onClick={() => handleErrorClick(field, error)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleErrorClick(field, error);
                  }
                }}
              >
                {displayText}
              </li>
            ))}
          </ul>
        )}
        
        {Object.keys(formErrors).length > maxErrors && (
          <div className="validation-summary__more">
            And {Object.keys(formErrors).length - maxErrors} more error{Object.keys(formErrors).length - maxErrors !== 1 ? 's' : ''}...
          </div>
        )}
      </div>
    </div>
  );

  const renderDefaultView = () => (
    <div className="validation-summary__default">
      {title && (
        <div className="validation-summary__title">
          <span className="validation-summary__icon">⚠</span>
          {title}
        </div>
      )}
      
      <ul className="validation-summary__errors">
        {processedErrors.map(({ field, error, displayText }, index) => (
          <li 
            key={index}
            className="validation-summary__error-item"
            onClick={() => handleErrorClick(field, error)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleErrorClick(field, error);
              }
            }}
          >
            {displayText}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div 
      className={summaryClasses}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {variant === 'compact' && renderCompactView()}
      {variant === 'detailed' && renderDetailedView()}
      {variant === 'default' && renderDefaultView()}
      
      {dismissible && (
        <button
          type="button"
          className="validation-summary__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss validation summary"
        >
          ✕
        </button>
      )}
    </div>
  );
};

ValidationSummary.propTypes = {
  form: PropTypes.object,
  errors: PropTypes.object,
  title: PropTypes.string,
  showFieldNames: PropTypes.bool,
  showOnlyTouched: PropTypes.bool,
  groupByField: PropTypes.bool,
  maxErrors: PropTypes.number,
  variant: PropTypes.oneOf(['default', 'compact', 'detailed']),
  severity: PropTypes.oneOf(['error', 'warning', 'info']),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  onErrorClick: PropTypes.func,
  className: PropTypes.string
};

export default ValidationSummary;
