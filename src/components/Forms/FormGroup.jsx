import React from 'react';
import PropTypes from 'prop-types';
import './Forms.css';

/**
 * FormGroup - Groups related form fields together with optional title and description
 */
const FormGroup = ({
  title,
  description,
  children,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  contentClassName = '',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  disabled = false,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const groupClasses = [
    'form-group',
    collapsible ? 'form-group--collapsible' : '',
    isCollapsed ? 'form-group--collapsed' : '',
    disabled ? 'form-group--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const titleClasses = [
    'form-group__title',
    collapsible ? 'form-group__title--clickable' : '',
    required ? 'form-group__title--required' : '',
    titleClassName
  ].filter(Boolean).join(' ');

  const descriptionClasses = [
    'form-group__description',
    descriptionClassName
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'form-group__content',
    contentClassName
  ].filter(Boolean).join(' ');

  const handleToggle = () => {
    if (collapsible && !disabled) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleKeyDown = (event) => {
    if (collapsible && !disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={groupClasses} {...props}>
      {title && (
        <div 
          className={titleClasses}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={collapsible && !disabled ? 0 : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          aria-controls={collapsible ? `${props.id || 'form-group'}-content` : undefined}
        >
          <span className="form-group__title-text">
            {title}
            {required && <span className="form-group__required-indicator" aria-label="required">*</span>}
          </span>
          {collapsible && (
            <span 
              className={`form-group__toggle-icon ${isCollapsed ? 'form-group__toggle-icon--collapsed' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          )}
        </div>
      )}

      {description && !isCollapsed && (
        <div className={descriptionClasses}>
          {description}
        </div>
      )}

      {!isCollapsed && (
        <div 
          id={collapsible ? `${props.id || 'form-group'}-content` : undefined}
          className={contentClasses}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                disabled: disabled || child.props.disabled,
                key: child.key || index
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

FormGroup.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  descriptionClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  collapsible: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string
};

export default FormGroup;
