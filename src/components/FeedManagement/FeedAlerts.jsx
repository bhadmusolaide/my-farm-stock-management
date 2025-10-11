import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { formatNumber, formatDate } from '../../utils/formatters';
import './FeedManagement.css';

const FeedAlerts = () => {
  const {
    feedAlerts = [],
    feedInventory = [],
    liveChickens = [],
    acknowledgeAlert,
    generateFeedAlerts
  } = useAppContext();

  const [filter, setFilter] = useState('all'); // all, low_stock, no_consumption, fcr_deviation, expiry_warning
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Generate alerts on mount and periodically
  useEffect(() => {
    if (generateFeedAlerts) {
      generateFeedAlerts();
      
      // Refresh alerts every 5 minutes
      const interval = setInterval(() => {
        generateFeedAlerts();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [generateFeedAlerts]);

  // Filter alerts
  const filteredAlerts = feedAlerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filter === 'all') return true;
    return alert.alert_type === filter;
  });

  // Group alerts by severity
  const criticalAlerts = filteredAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = filteredAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = filteredAlerts.filter(a => a.severity === 'info');

  // Handle acknowledge
  const handleAcknowledge = async (alertId) => {
    if (acknowledgeAlert) {
      await acknowledgeAlert(alertId);
    }
  };

  // Get alert icon
  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'low_stock':
        return '📦';
      case 'no_consumption':
        return '⏰';
      case 'fcr_deviation':
        return '📊';
      case 'expiry_warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  // Get severity color class
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-critical';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  };

  // Render alert card
  const renderAlertCard = (alert) => {
    const feed = feedInventory.find(f => f.id === alert.feed_id);
    const batch = liveChickens.find(b => b.id === alert.chicken_batch_id);

    return (
      <div key={alert.id} className={`alert-card ${getSeverityClass(alert.severity)}`}>
        <div className="alert-header">
          <div className="alert-icon">{getAlertIcon(alert.alert_type)}</div>
          <div className="alert-title">
            <h5>{alert.alert_type.replace(/_/g, ' ').toUpperCase()}</h5>
            <span className="alert-time">{formatDate(alert.created_at)}</span>
          </div>
          {!alert.acknowledged && (
            <button
              className="btn-acknowledge"
              onClick={() => handleAcknowledge(alert.id)}
              title="Acknowledge alert"
            >
              ✓
            </button>
          )}
        </div>

        <div className="alert-body">
          <p className="alert-message">{alert.message}</p>
          
          {feed && (
            <div className="alert-details">
              <strong>Feed:</strong> {feed.feed_type} - {feed.brand} (Batch: {feed.batch_number})
            </div>
          )}
          
          {batch && (
            <div className="alert-details">
              <strong>Batch:</strong> {batch.batch_id} - {batch.breed} ({batch.current_count} birds)
            </div>
          )}
        </div>

        {alert.action_link && (
          <div className="alert-footer">
            <a href={alert.action_link} className="alert-action-link">
              Take Action →
            </a>
          </div>
        )}

        {alert.acknowledged && (
          <div className="alert-acknowledged">
            <small>✓ Acknowledged on {formatDate(alert.acknowledged_at)}</small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="feed-alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-title">
          <h3>Feed Alerts & Notifications</h3>
          <span className="alerts-count">
            {filteredAlerts.length} {showAcknowledged ? 'total' : 'active'}
          </span>
        </div>
        
        <div className="alerts-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => generateFeedAlerts && generateFeedAlerts()}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        <div className="filter-group">
          <label>Filter by Type:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Alerts</option>
            <option value="low_stock">Low Stock</option>
            <option value="no_consumption">No Consumption</option>
            <option value="fcr_deviation">FCR Deviation</option>
            <option value="expiry_warning">Expiry Warning</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
            />
            <span>Show Acknowledged</span>
          </label>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="alerts-summary">
        <div className="summary-stat critical">
          <span className="stat-value">{criticalAlerts.length}</span>
          <span className="stat-label">Critical</span>
        </div>
        <div className="summary-stat warning">
          <span className="stat-value">{warningAlerts.length}</span>
          <span className="stat-label">Warnings</span>
        </div>
        <div className="summary-stat info">
          <span className="stat-value">{infoAlerts.length}</span>
          <span className="stat-label">Info</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✓</div>
            <h4>No Alerts</h4>
            <p>
              {showAcknowledged
                ? 'No alerts found matching your filters.'
                : 'All clear! No active alerts at the moment.'}
            </p>
          </div>
        ) : (
          <>
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <div className="alert-section">
                <h4 className="section-title critical">🚨 Critical Alerts</h4>
                {criticalAlerts.map(renderAlertCard)}
              </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
              <div className="alert-section">
                <h4 className="section-title warning">⚠️ Warnings</h4>
                {warningAlerts.map(renderAlertCard)}
              </div>
            )}

            {/* Info Alerts */}
            {infoAlerts.length > 0 && (
              <div className="alert-section">
                <h4 className="section-title info">ℹ️ Information</h4>
                {infoAlerts.map(renderAlertCard)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions Panel */}
      {criticalAlerts.length > 0 && (
        <div className="quick-actions-panel">
          <h4>Quick Actions</h4>
          <div className="quick-action-buttons">
            <button className="btn btn-primary" onClick={() => window.location.href = '#/feed-management?tab=inventory&action=add'}>
              + Add Feed Stock
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '#/feed-management?tab=consumption&action=log'}>
              📝 Log Consumption
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedAlerts;

