import React from 'react';
import { formatDate } from '../../utils/formatters';
import './Reports.css';

const ReportFilters = ({
  viewMode,
  setViewMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onDateRangeChange,
  onResetView
}) => {
  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setViewMode('custom');
      onDateRangeChange();
    }
  };

  const getViewDescription = () => {
    switch (viewMode) {
      case 'weekly':
        return 'Showing data for the current week';
      case 'monthly':
        return 'Showing data for the current month';
      case 'custom':
        if (startDate && endDate) {
          return `Showing data from ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`;
        }
        return 'Select a date range';
      default:
        return '';
    }
  };

  return (
    <div className="report-filters">
      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <div className="toggle-container">
          <button 
            className={`toggle-button ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            📅 Weekly View
          </button>
          <button 
            className={`toggle-button ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            📊 Monthly View
          </button>
          <button 
            className={`toggle-button ${viewMode === 'custom' ? 'active' : ''}`}
            onClick={() => setViewMode('custom')}
          >
            🗓️ Custom Range
          </button>
        </div>
        
        {viewMode === 'custom' && (
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date">From:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={handleDateRangeChange}
              />
            </div>
            
            <div className="date-input-group">
              <label htmlFor="end-date">To:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={handleDateRangeChange}
              />
            </div>
            
            <button 
              onClick={onResetView} 
              className="btn btn-secondary reset-btn"
              title="Reset to monthly view"
            >
              🔄 Reset
            </button>
          </div>
        )}
        
        <div className="view-description">
          <p>{getViewDescription()}</p>
        </div>
      </div>

      {/* Quick Date Presets for Custom Range */}
      {viewMode === 'custom' && (
        <div className="date-presets">
          <h4>Quick Presets:</h4>
          <div className="preset-buttons">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                setStartDate(lastWeek.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                handleDateRangeChange();
              }}
            >
              Last 7 Days
            </button>
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setDate(today.getDate() - 30);
                setStartDate(lastMonth.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                handleDateRangeChange();
              }}
            >
              Last 30 Days
            </button>
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                const today = new Date();
                const lastQuarter = new Date(today);
                lastQuarter.setDate(today.getDate() - 90);
                setStartDate(lastQuarter.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                handleDateRangeChange();
              }}
            >
              Last 90 Days
            </button>
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                const today = new Date();
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                setStartDate(startOfYear.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                handleDateRangeChange();
              }}
            >
              Year to Date
            </button>
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                const today = new Date();
                const lastYear = new Date(today);
                lastYear.setFullYear(today.getFullYear() - 1);
                setStartDate(lastYear.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                handleDateRangeChange();
              }}
            >
              Last Year
            </button>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className="filter-summary">
        <div className="summary-item">
          <span className="summary-label">View Mode:</span>
          <span className="summary-value">
            {viewMode === 'weekly' ? '📅 Weekly' : 
             viewMode === 'monthly' ? '📊 Monthly' : 
             '🗓️ Custom Range'}
          </span>
        </div>
        
        {viewMode === 'custom' && startDate && endDate && (
          <>
            <div className="summary-item">
              <span className="summary-label">Date Range:</span>
              <span className="summary-value">
                {formatDate(new Date(startDate))} - {formatDate(new Date(endDate))}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">
                {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
