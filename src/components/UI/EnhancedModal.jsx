import React, { useEffect, useRef } from 'react';
import './EnhancedModal.css';

const EnhancedModal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'medium', // 'small', 'medium', 'large', 'xl', 'fullscreen'
  variant = 'default', // 'default', 'form', 'confirmation', 'info'
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer = null,
  loading = false,
  error = null,
  onAfterOpen = null,
  onAfterClose = null,
  zIndex = 1000,
  animation = 'fade', // 'fade', 'slide', 'zoom', 'none'
  position = 'center', // 'center', 'top', 'bottom'
  maxHeight = '90vh',
  scrollable = true
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle body scroll prevention
  useEffect(() => {
    if (isOpen && preventBodyScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      
      // Focus the modal after a brief delay to ensure it's rendered
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);

      if (onAfterOpen) {
        onAfterOpen();
      }

      return () => clearTimeout(timer);
    } else {
      // Restore focus when modal closes
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
      
      if (onAfterClose) {
        onAfterClose();
      }
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle close button click
  const handleCloseClick = () => {
    onClose();
  };

  // Focus trap within modal
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  // Build CSS classes
  const overlayClasses = [
    'enhanced-modal-overlay',
    `enhanced-modal-overlay--${animation}`,
    `enhanced-modal-overlay--${position}`,
    overlayClassName
  ].filter(Boolean).join(' ');

  const modalClasses = [
    'enhanced-modal',
    `enhanced-modal--${size}`,
    `enhanced-modal--${variant}`,
    `enhanced-modal--${animation}`,
    scrollable ? 'enhanced-modal--scrollable' : '',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'enhanced-modal__content',
    contentClassName
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={overlayClasses}
      onClick={handleOverlayClick}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ maxHeight }}
      >
        <div className={contentClasses}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`enhanced-modal__header ${headerClassName}`}>
              {title && (
                <h2 id="modal-title" className="enhanced-modal__title">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="enhanced-modal__close"
                  onClick={handleCloseClick}
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`enhanced-modal__body ${bodyClassName}`}>
            {loading && (
              <div className="enhanced-modal__loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            )}
            
            {error && (
              <div className="enhanced-modal__error">
                <p>{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
              </div>
            )}
            
            {!loading && !error && children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`enhanced-modal__footer ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Predefined modal components for common use cases
export const FormModal = ({ onSubmit, onCancel, submitText = 'Save', cancelText = 'Cancel', submitDisabled = false, ...props }) => (
  <EnhancedModal
    variant="form"
    footer={
      <div className="modal-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {cancelText}
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          {submitText}
        </button>
      </div>
    }
    {...props}
  />
);

export const ConfirmationModal = ({ 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'confirmation',
  ...props 
}) => (
  <EnhancedModal
    variant={variant}
    size="small"
    footer={
      <div className="modal-confirmation-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    }
    {...props}
  />
);

export const InfoModal = ({ onClose, closeText = 'Close', ...props }) => (
  <EnhancedModal
    variant="info"
    footer={
      <div className="modal-info-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {closeText}
        </button>
      </div>
    }
    {...props}
  />
);

export default EnhancedModal;
