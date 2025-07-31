import React, { useState } from 'react';
import './ColumnFilter.css';

const ColumnFilter = ({ columns, visibleColumns, onColumnToggle, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (columnKey) => {
    onColumnToggle(columnKey);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`column-filter ${className}`}>
      <button 
        className="column-filter-toggle"
        onClick={toggleDropdown}
        type="button"
      >
        <span>Columns</span>
        <svg 
          className={`column-filter-icon ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="currentColor"
        >
          <path d="M4.5 6L8 9.5L11.5 6H4.5Z"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="column-filter-dropdown">
          <div className="column-filter-header">
            <span>Show/Hide Columns</span>
          </div>
          <div className="column-filter-options">
            {columns.map((column) => (
              <label key={column.key} className="column-filter-option">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => handleToggle(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
          <div className="column-filter-actions">
            <button 
              type="button"
              className="column-filter-action"
              onClick={() => {
                columns.forEach(col => {
                  if (!visibleColumns.includes(col.key)) {
                    handleToggle(col.key);
                  }
                });
              }}
            >
              Show All
            </button>
            <button 
              type="button"
              className="column-filter-action"
              onClick={() => {
                visibleColumns.forEach(colKey => {
                  if (colKey !== columns[0]?.key) { // Keep first column always visible
                    handleToggle(colKey);
                  }
                });
              }}
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnFilter;