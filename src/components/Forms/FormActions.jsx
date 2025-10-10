import React from 'react';
import PropTypes from 'prop-types';
import './Forms.css';

/**
 * FormActions - Standardized form action buttons with consistent spacing and alignment
 */
const FormActions = ({
  children,
  className = '',
  alignment = 'right', // left, center, right, space-between, space-around
  spacing = 'medium', // small, medium, large
  variant = 'default', // default, sticky, floating
  reversed = false,
  fullWidth = false,
  ...props
}) => {
  const actionsClasses = [
    'form-actions',
    `form-actions--${alignment}`,
    `form-actions--${spacing}`,
    `form-actions--${variant}`,
    reversed ? 'form-actions--reversed' : '',
    fullWidth ? 'form-actions--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  // Process children to add consistent button styling
  const processedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === 'button') {
      return React.cloneElement(child, {
        className: `form-actions__button ${child.props.className || ''}`.trim(),
        key: child.key || index
      });
    }
    return child;
  });

  return (
    <div className={actionsClasses} {...props}>
      {processedChildren}
    </div>
  );
};

/**
 * PrimaryButton - Primary action button for forms
 */
export const PrimaryButton = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left', // left, right
  size = 'medium', // small, medium, large
  variant = 'primary', // primary, secondary, success, danger, warning
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    loading ? 'btn--loading' : '',
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <button 
      className={buttonClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn__spinner" aria-hidden="true">⟳</span>
          {loadingText}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="btn__icon btn__icon--left" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="btn__text">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="btn__icon btn__icon--right" aria-hidden="true">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

/**
 * SecondaryButton - Secondary action button for forms
 */
export const SecondaryButton = (props) => (
  <PrimaryButton {...props} variant="secondary" />
);

/**
 * CancelButton - Cancel/reset button for forms
 */
export const CancelButton = (props) => (
  <PrimaryButton {...props} variant="outline" />
);

/**
 * SubmitButton - Submit button with form integration
 */
export const SubmitButton = ({
  form,
  children = 'Submit',
  ...props
}) => {
  const isLoading = form?.isSubmitting;
  const isDisabled = form ? (!form.isValid || form.isSubmitting) : false;

  return (
    <PrimaryButton
      type="submit"
      loading={isLoading}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </PrimaryButton>
  );
};

/**
 * ResetButton - Reset button with form integration
 */
export const ResetButton = ({
  form,
  children = 'Reset',
  confirmReset = false,
  confirmMessage = 'Are you sure you want to reset the form?',
  ...props
}) => {
  const handleReset = (event) => {
    if (confirmReset) {
      if (!window.confirm(confirmMessage)) {
        event.preventDefault();
        return;
      }
    }
    
    if (form?.reset) {
      form.reset();
    }
    
    if (props.onClick) {
      props.onClick(event);
    }
  };

  return (
    <CancelButton
      type="button"
      onClick={handleReset}
      disabled={form ? !form.isDirty : false}
      {...props}
    >
      {children}
    </CancelButton>
  );
};

// PropTypes
FormActions.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  alignment: PropTypes.oneOf(['left', 'center', 'right', 'space-between', 'space-around']),
  spacing: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'sticky', 'floating']),
  reversed: PropTypes.bool,
  fullWidth: PropTypes.bool
};

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'outline']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

SubmitButton.propTypes = {
  form: PropTypes.object,
  children: PropTypes.node
};

ResetButton.propTypes = {
  form: PropTypes.object,
  children: PropTypes.node,
  confirmReset: PropTypes.bool,
  confirmMessage: PropTypes.string
};

export default FormActions;
