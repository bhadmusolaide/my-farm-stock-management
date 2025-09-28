import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  // Track when the modal mounts/unmounts
  useEffect(() => {
    return () => {
    };
  }, []);

  // Handle clicks on the modal overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;