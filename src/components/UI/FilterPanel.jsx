import React, { useState, useEffect } from 'react';
import './FilterPanel.css';

const FilterPanel = ({
  filters = {},
  onFiltersChange,
  filterConfig = [],
  className = '',
  variant = 'default', // 'default', 'compact', 'sidebar'
  collapsible = false,
  defaultCollapsed = false,
  showClearAll = true,
  showApplyButton = false,
  applyButtonText = 'Apply Filters',
  clearButtonText = 'Clear All',
  title = 'Filters',
  persistFilters = false,
  storageKey = 'filters'
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Load persisted filters on mount
  useEffect(() => {
    if (persistFilters) {
      try {
        const savedFilters = localStorage.getItem(storageKey);
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          setLocalFilters(parsed);
          onFiltersChange(parsed);
        }
      } catch (error) {
        console.warn('Failed to load persisted filters:', error);
      }
    }
  }, [persistFilters, storageKey, onFiltersChange]);

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);

    // If not using apply button, update immediately
    if (!showApplyButton) {
      onFiltersChange(newFilters);
      
      // Persist filters if enabled
      if (persistFilters) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newFilters));
        } catch (error) {
          console.warn('Failed to persist filters:', error);
        }
      }
    }
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    
    if (persistFilters) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(localFilters));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
  };

  // Handle clear all filters
  const handleClearAll = () => {
    const clearedFilters = {};
    filterConfig.forEach(config => {
      clearedFilters[config.key] = config.defaultValue || '';
    });
    
    setLocalFilters(clearedFilters);
    
    if (!showApplyButton) {
      onFiltersChange(clearedFilters);
    }
    
    if (persistFilters) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear persisted filters:', error);
      }
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  // Render individual filter input
  const renderFilterInput = (config) => {
    const value = localFilters[config.key] || '';

    switch (config.type) {
      case 'text':
        return (
          <input
            type="text"
            id={config.key}
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className="filter-input"
          />
        );

      case 'search':
        return (
          <input
            type="search"
            id={config.key}
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className="filter-input filter-search"
          />
        );

      case 'select':
        return (
          <select
            id={config.key}
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            className="filter-select"
          >
            <option value="">{config.placeholder || 'All'}</option>
            {config.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            id={config.key}
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            className="filter-input"
          />
        );

      case 'dateRange':
        return (
          <div className="date-range-inputs">
            <input
              type="date"
              value={value.start || ''}
              onChange={(e) => handleFilterChange(config.key, { ...value, start: e.target.value })}
              placeholder="Start date"
              className="filter-input"
            />
            <span className="date-range-separator">to</span>
            <input
              type="date"
              value={value.end || ''}
              onChange={(e) => handleFilterChange(config.key, { ...value, end: e.target.value })}
              placeholder="End date"
              className="filter-input"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={config.key}
            value={value}
            onChange={(e) => handleFilterChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            step={config.step}
            className="filter-input"
          />
        );

      case 'checkbox':
        return (
          <div className="filter-checkbox-group">
            {config.options?.map(option => (
              <label key={option.value} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value);
                    handleFilterChange(config.key, newValues);
                  }}
                  className="filter-checkbox"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="filter-radio-group">
            {config.options?.map(option => (
              <label key={option.value} className="filter-radio-label">
                <input
                  type="radio"
                  name={config.key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFilterChange(config.key, e.target.value)}
                  className="filter-radio"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Build CSS classes
  const panelClasses = [
    'filter-panel',
    `filter-panel--${variant}`,
    isCollapsed ? 'filter-panel--collapsed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">{title}</h3>
        <div className="filter-panel__header-actions">
          {hasActiveFilters && (
            <span className="filter-panel__active-count">
              {Object.values(localFilters).filter(v => v !== '' && v !== null && v !== undefined).length} active
            </span>
          )}
          {collapsible && (
            <button
              type="button"
              className="filter-panel__toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              <svg 
                className={`filter-panel__toggle-icon ${isCollapsed ? 'collapsed' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="currentColor"
              >
                <path d="M4.5 6L8 9.5L11.5 6H4.5Z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="filter-panel__content">
          {/* Filter Inputs */}
          <div className="filter-panel__filters">
            {filterConfig.map(config => (
              <div key={config.key} className="filter-panel__filter">
                <label htmlFor={config.key} className="filter-panel__label">
                  {config.label}
                  {config.required && <span className="required">*</span>}
                </label>
                {renderFilterInput(config)}
                {config.description && (
                  <small className="filter-panel__description">
                    {config.description}
                  </small>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="filter-panel__actions">
            {showClearAll && hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearAll}
              >
                {clearButtonText}
              </button>
            )}
            {showApplyButton && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApplyFilters}
              >
                {applyButtonText}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
