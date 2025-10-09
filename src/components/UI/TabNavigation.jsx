import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'default', // 'default', 'pills', 'underline', 'cards'
  size = 'medium', // 'small', 'medium', 'large'
  orientation = 'horizontal', // 'horizontal', 'vertical'
  className = '',
  tabClassName = '',
  activeTabClassName = '',
  disabled = false,
  showBadges = false, // Show notification badges
  fullWidth = false, // Make tabs take full width
  scrollable = false, // Enable horizontal scrolling for many tabs
  persistActiveTab = false, // Persist active tab in localStorage
  storageKey = 'activeTab'
}) => {
  // Persist active tab if enabled
  React.useEffect(() => {
    if (persistActiveTab && activeTab) {
      localStorage.setItem(storageKey, activeTab);
    }
  }, [activeTab, persistActiveTab, storageKey]);

  // Load persisted active tab on mount
  React.useEffect(() => {
    if (persistActiveTab && !activeTab) {
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab && tabs.find(tab => tab.key === savedTab)) {
        onTabChange(savedTab);
      }
    }
  }, [persistActiveTab, storageKey, tabs, activeTab, onTabChange]);

  // Handle tab click
  const handleTabClick = (tab, event) => {
    if (disabled || tab.disabled) {
      event.preventDefault();
      return;
    }

    if (tab.onClick) {
      tab.onClick(tab, event);
    }

    if (onTabChange) {
      onTabChange(tab.key, tab, event);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (tab, event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tab, event);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const currentIndex = tabs.findIndex(t => t.key === activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (!nextTab.disabled) {
        handleTabClick(nextTab, event);
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = tabs.findIndex(t => t.key === activeTab);
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      const prevTab = tabs[prevIndex];
      if (!prevTab.disabled) {
        handleTabClick(prevTab, event);
      }
    }
  };

  // Build CSS classes
  const containerClasses = [
    'tab-navigation',
    `tab-navigation--${variant}`,
    `tab-navigation--${size}`,
    `tab-navigation--${orientation}`,
    fullWidth ? 'tab-navigation--full-width' : '',
    scrollable ? 'tab-navigation--scrollable' : '',
    disabled ? 'tab-navigation--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // Render tab content
  const renderTab = (tab) => {
    const isActive = activeTab === tab.key;
    const isDisabled = disabled || tab.disabled;

    const tabClasses = [
      'tab-navigation__tab',
      isActive ? 'tab-navigation__tab--active' : '',
      isDisabled ? 'tab-navigation__tab--disabled' : '',
      tab.className || '',
      tabClassName,
      isActive ? activeTabClassName : ''
    ].filter(Boolean).join(' ');

    return (
      <button
        key={tab.key}
        type="button"
        className={tabClasses}
        onClick={(e) => handleTabClick(tab, e)}
        onKeyDown={(e) => handleKeyDown(tab, e)}
        disabled={isDisabled}
        aria-selected={isActive}
        role="tab"
        tabIndex={isActive ? 0 : -1}
        title={tab.tooltip || tab.label}
      >
        {/* Icon */}
        {tab.icon && (
          <span className="tab-navigation__icon">
            {typeof tab.icon === 'string' ? (
              <span dangerouslySetInnerHTML={{ __html: tab.icon }} />
            ) : (
              tab.icon
            )}
          </span>
        )}

        {/* Label */}
        <span className="tab-navigation__label">{tab.label}</span>

        {/* Badge */}
        {showBadges && tab.badge && (
          <span className={`tab-navigation__badge ${tab.badgeType || 'default'}`}>
            {tab.badge}
          </span>
        )}

        {/* Close button for closeable tabs */}
        {tab.closeable && !isDisabled && (
          <button
            type="button"
            className="tab-navigation__close"
            onClick={(e) => {
              e.stopPropagation();
              if (tab.onClose) {
                tab.onClose(tab, e);
              }
            }}
            aria-label={`Close ${tab.label}`}
          >
            ×
          </button>
        )}
      </button>
    );
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={containerClasses} role="tablist">
      {scrollable ? (
        <div className="tab-navigation__scroll-container">
          {tabs.map(renderTab)}
        </div>
      ) : (
        tabs.map(renderTab)
      )}
    </div>
  );
};

// Predefined tab navigation components for common use cases
export const PageTabs = ({ children, ...props }) => (
  <TabNavigation variant="underline" size="large" fullWidth {...props}>
    {children}
  </TabNavigation>
);

export const CardTabs = ({ children, ...props }) => (
  <TabNavigation variant="cards" {...props}>
    {children}
  </TabNavigation>
);

export const PillTabs = ({ children, ...props }) => (
  <TabNavigation variant="pills" size="small" {...props}>
    {children}
  </TabNavigation>
);

export const VerticalTabs = ({ children, ...props }) => (
  <TabNavigation orientation="vertical" {...props}>
    {children}
  </TabNavigation>
);

export default TabNavigation;
