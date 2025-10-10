import React from 'react';
import PropTypes from 'prop-types';
import './Forms.css';

/**
 * FormSection - Major form section with header, optional actions, and content area
 */
const FormSection = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  collapsible = false,
  defaultCollapsed = false,
  variant = 'default', // default, card, bordered, minimal
  size = 'medium', // small, medium, large
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const sectionClasses = [
    'form-section',
    `form-section--${variant}`,
    `form-section--${size}`,
    collapsible ? 'form-section--collapsible' : '',
    isCollapsed ? 'form-section--collapsed' : '',
    className
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'form-section__header',
    collapsible ? 'form-section__header--clickable' : '',
    headerClassName
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'form-section__content',
    contentClassName
  ].filter(Boolean).join(' ');

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleKeyDown = (event) => {
    if (collapsible && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <section className={sectionClasses} {...props}>
      {(title || subtitle || icon || actions) && (
        <header 
          className={headerClasses}
          onClick={collapsible ? handleToggle : undefined}
          onKeyDown={collapsible ? handleKeyDown : undefined}
          tabIndex={collapsible ? 0 : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          aria-controls={collapsible ? `${props.id || 'form-section'}-content` : undefined}
        >
          <div className="form-section__header-content">
            {icon && (
              <div className="form-section__icon" aria-hidden="true">
                {typeof icon === 'string' ? <span>{icon}</span> : icon}
              </div>
            )}
            
            <div className="form-section__header-text">
              {title && (
                <h3 className="form-section__title">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="form-section__subtitle">
                  {subtitle}
                </p>
              )}
            </div>

            {collapsible && (
              <div className="form-section__toggle">
                <span 
                  className={`form-section__toggle-icon ${isCollapsed ? 'form-section__toggle-icon--collapsed' : ''}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </div>
            )}
          </div>

          {actions && !collapsible && (
            <div className="form-section__actions">
              {actions}
            </div>
          )}
        </header>
      )}

      {!isCollapsed && (
        <div 
          id={collapsible ? `${props.id || 'form-section'}-content` : undefined}
          className={contentClasses}
        >
          {children}
        </div>
      )}
    </section>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  collapsible: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'card', 'bordered', 'minimal']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  id: PropTypes.string
};

export default FormSection;
