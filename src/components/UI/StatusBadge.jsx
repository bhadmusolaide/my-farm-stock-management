import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({
  status,
  variant = 'default', // 'default', 'dot', 'pill', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  customColors = null, // { background: '#color', text: '#color', border: '#color' }
  className = '',
  children = null, // Custom content, overrides status text
  showIcon = false,
  onClick = null
}) => {
  // Normalize status to lowercase for consistent mapping
  const normalizedStatus = status ? String(status).toLowerCase() : 'unknown';

  // Default status mappings
  const statusConfig = {
    // Health/General Status
    healthy: { label: 'Healthy', type: 'success', icon: '✓' },
    active: { label: 'Active', type: 'success', icon: '●' },
    good: { label: 'Good', type: 'success', icon: '✓' },
    
    // Warning States
    sick: { label: 'Sick', type: 'warning', icon: '⚠' },
    warning: { label: 'Warning', type: 'warning', icon: '⚠' },
    'expiring-soon': { label: 'Expiring Soon', type: 'warning', icon: '⚠' },

    // Pending State (Red/Orange to differentiate from Partial)
    pending: { label: 'Pending', type: 'danger', icon: '⏳' },
    
    // Critical/Error States
    quarantine: { label: 'Quarantine', type: 'danger', icon: '🚫' },
    expired: { label: 'Expired', type: 'danger', icon: '❌' },
    critical: { label: 'Critical', type: 'danger', icon: '❌' },
    failed: { label: 'Failed', type: 'danger', icon: '❌' },
    cancelled: { label: 'Cancelled', type: 'danger', icon: '❌' },
    
    // Processing States
    processing: { label: 'Processing', type: 'info', icon: '⚙' },
    'in-progress': { label: 'In Progress', type: 'info', icon: '⚙' },
    'in-storage': { label: 'In Storage', type: 'info', icon: '📦' },
    
    // Completed States
    completed: { label: 'Completed', type: 'success', icon: '✓' },
    done: { label: 'Done', type: 'success', icon: '✓' },
    delivered: { label: 'Delivered', type: 'success', icon: '✓' },

    // Payment Status
    paid: { label: 'Paid', type: 'success', icon: '💰' },
    partial: { label: 'Partial', type: 'warning', icon: '💳' },
    
    // Neutral States
    inactive: { label: 'Inactive', type: 'secondary', icon: '○' },
    disabled: { label: 'Disabled', type: 'secondary', icon: '○' },
    draft: { label: 'Draft', type: 'secondary', icon: '📝' },
    
    // Default
    unknown: { label: 'Unknown', type: 'secondary', icon: '?' }
  };

  const config = statusConfig[normalizedStatus] || statusConfig.unknown;
  
  // Build CSS classes
  const classes = [
    'status-badge',
    `status-badge--${config.type}`,
    `status-badge--${variant}`,
    `status-badge--${size}`,
    onClick ? 'status-badge--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  // Custom styling
  const customStyle = customColors ? {
    backgroundColor: customColors.background,
    color: customColors.text,
    borderColor: customColors.border
  } : {};

  // Content to display
  const displayContent = children || config.label;
  
  // Icon element
  const iconElement = showIcon && config.icon ? (
    <span className="status-badge__icon">{config.icon}</span>
  ) : null;

  // Handle click
  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(status, e);
    }
  };

  return (
    <span 
      className={classes}
      style={customStyle}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      } : undefined}
    >
      {iconElement}
      <span className="status-badge__text">{displayContent}</span>
    </span>
  );
};

// Predefined status badge components for common use cases
export const HealthStatusBadge = ({ status, ...props }) => (
  <StatusBadge status={status} showIcon={true} {...props} />
);

export const OrderStatusBadge = ({ status, ...props }) => (
  <StatusBadge status={status} variant="pill" {...props} />
);

export const ProcessingStatusBadge = ({ status, ...props }) => (
  <StatusBadge status={status} variant="outline" showIcon={true} {...props} />
);

export const ExpiryStatusBadge = ({ expiryDate, ...props }) => {
  if (!expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  let status, customColors;
  
  if (daysUntilExpiry < 0) {
    status = 'expired';
    customColors = { background: '#dc3545', text: '#fff' };
  } else if (daysUntilExpiry <= 7) {
    status = 'expiring-soon';
    customColors = { background: '#ffc107', text: '#000' };
  } else {
    return null; // Don't show badge if not expiring soon
  }
  
  return (
    <StatusBadge 
      status={status} 
      customColors={customColors}
      showIcon={true}
      {...props}
    />
  );
};

export default StatusBadge;
