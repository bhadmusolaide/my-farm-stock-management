import React from 'react';
import './Card.css';

// Base Card Component
export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  hover = false,
  ...props 
}) => {
  const cardClasses = [
    'ui-card',
    `ui-card--${variant}`,
    `ui-card--padding-${padding}`,
    `ui-card--shadow-${shadow}`,
    hover && 'ui-card--hover',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Summary Card Component
export const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  variant = 'default',
  trend,
  subtitle,
  className = '',
  ...props 
}) => {
  return (
    <Card 
      className={`summary-card summary-card--${variant} ${className}`} 
      hover={true}
      {...props}
    >
      <div className="summary-card__content">
        {icon && (
          <div className="summary-card__icon">
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}
        <div className="summary-card__info">
          <div className="summary-card__title">{title}</div>
          <div className="summary-card__value">{value}</div>
          {subtitle && <div className="summary-card__subtitle">{subtitle}</div>}
          {trend && <div className="summary-card__trend">{trend}</div>}
        </div>
      </div>
    </Card>
  );
};

// Stat Card Component
export const StatCard = ({ 
  label, 
  value, 
  icon, 
  variant = 'default',
  size = 'default',
  className = '',
  ...props 
}) => {
  return (
    <Card 
      className={`stat-card stat-card--${variant} stat-card--${size} ${className}`} 
      {...props}
    >
      {icon && (
        <div className="stat-card__icon">
          {typeof icon === 'string' ? <span>{icon}</span> : icon}
        </div>
      )}
      <div className="stat-card__content">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
      </div>
    </Card>
  );
};

// Metric Card Component
export const MetricCard = ({ 
  title, 
  value, 
  unit,
  change,
  changeType,
  icon,
  variant = 'default',
  className = '',
  ...props 
}) => {
  return (
    <Card 
      className={`metric-card metric-card--${variant} ${className}`} 
      {...props}
    >
      <div className="metric-card__header">
        {icon && <div className="metric-card__icon">{icon}</div>}
        <div className="metric-card__title">{title}</div>
      </div>
      <div className="metric-card__body">
        <div className="metric-card__value">
          {value}
          {unit && <span className="metric-card__unit">{unit}</span>}
        </div>
        {change && (
          <div className={`metric-card__change metric-card__change--${changeType}`}>
            {change}
          </div>
        )}
      </div>
    </Card>
  );
};

// Alert Card Component
export const AlertCard = ({ 
  type = 'info', 
  title, 
  message, 
  icon,
  dismissible = false,
  onDismiss,
  className = '',
  ...props 
}) => {
  return (
    <Card 
      className={`alert-card alert-card--${type} ${className}`} 
      variant={type}
      {...props}
    >
      <div className="alert-card__content">
        {icon && <div className="alert-card__icon">{icon}</div>}
        <div className="alert-card__text">
          {title && <div className="alert-card__title">{title}</div>}
          {message && <div className="alert-card__message">{message}</div>}
        </div>
        {dismissible && (
          <button 
            className="alert-card__dismiss" 
            onClick={onDismiss}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </Card>
  );
};

// Health Status Card Component
export const HealthStatusCard = ({ 
  status, 
  count, 
  percentage,
  icon,
  className = '',
  ...props 
}) => {
  const statusVariants = {
    healthy: 'success',
    sick: 'warning', 
    critical: 'danger',
    dead: 'danger'
  };

  return (
    <Card 
      className={`health-status-card health-status-card--${status} ${className}`} 
      variant={statusVariants[status] || 'default'}
      hover={true}
      {...props}
    >
      <div className="health-status-card__content">
        {icon && (
          <div className="health-status-card__icon">
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}
        <div className="health-status-card__info">
          <div className="health-status-card__status">{status}</div>
          <div className="health-status-card__count">{count}</div>
          {percentage && (
            <div className="health-status-card__percentage">{percentage}%</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Card;
