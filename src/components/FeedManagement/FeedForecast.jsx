import React, { useMemo } from 'react';
import { useAppContext } from '../../context';
import { formatNumber, formatDate } from '../../utils/formatters';
import { FEED_TYPES } from '../../utils/constants';
import './FeedManagement.css';

const FeedForecast = () => {
  const {
    feedInventory = [],
    feedConsumption = [],
    getAllFeedForecasts,
    calculateFeedForecast
  } = useAppContext();

  // Aggregate feed by type and calculate forecasts
  const forecastsByType = useMemo(() => {
    const aggregated = {};

    // Group inventory by feed type
    FEED_TYPES.forEach(feedType => {
      const typeInventory = feedInventory.filter(f => f.feed_type === feedType);
      const totalStock = typeInventory.reduce((sum, f) => sum + (f.quantity_kg || 0), 0);

      // Calculate consumption for this feed type (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const typeConsumption = feedConsumption.filter(c => {
        const feed = feedInventory.find(f => f.id === c.feed_id);
        return feed && feed.feed_type === feedType && new Date(c.consumption_date) >= thirtyDaysAgo;
      });

      const totalConsumed = typeConsumption.reduce((sum, c) => sum + (c.quantity_consumed || 0), 0);
      const avgDailyConsumption = totalConsumed / 30;

      // Calculate depletion date
      let projectedDepletionDate = null;
      let daysRemaining = null;
      if (avgDailyConsumption > 0 && totalStock > 0) {
        daysRemaining = Math.floor(totalStock / avgDailyConsumption);
        projectedDepletionDate = new Date();
        projectedDepletionDate.setDate(projectedDepletionDate.getDate() + daysRemaining);
      }

      // Determine urgency
      let urgency = 'low';
      if (totalStock === 0) urgency = 'critical';
      else if (daysRemaining !== null) {
        if (daysRemaining <= 3) urgency = 'critical';
        else if (daysRemaining <= 7) urgency = 'high';
        else if (daysRemaining <= 14) urgency = 'medium';
      }

      // Calculate suggested purchase (14 days supply)
      const suggestedPurchaseQuantity = avgDailyConsumption * 14;

      aggregated[feedType] = {
        feedType,
        currentStock: totalStock,
        avgDailyConsumption,
        projectedDepletionDate,
        daysRemaining,
        urgency,
        suggestedPurchaseQuantity,
        forecastDays: 14,
        purchases: typeInventory.length
      };
    });

    // Sort by urgency
    return Object.values(aggregated).sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [feedInventory, feedConsumption]);

  // Get urgency class
  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'urgency-critical';
      case 'high':
        return 'urgency-high';
      case 'medium':
        return 'urgency-medium';
      case 'low':
        return 'urgency-low';
      default:
        return 'urgency-none';
    }
  };

  // Get urgency icon
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📊';
      case 'low':
        return '✓';
      default:
        return '📈';
    }
  };

  // Get urgency label
  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'Critical - Order Now';
      case 'high':
        return 'High - Order Soon';
      case 'medium':
        return 'Medium - Monitor';
      case 'low':
        return 'Low - Sufficient Stock';
      default:
        return 'No Data';
    }
  };

  // Calculate days until depletion
  const getDaysUntilDepletion = (depletionDate) => {
    if (!depletionDate) return null;
    const today = new Date();
    const depletion = new Date(depletionDate);
    const diffTime = depletion - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="feed-forecast-container">
      {/* Header */}
      <div className="forecast-header">
        <div className="forecast-title">
          <h3>📈 Predictive Feed Forecasting</h3>
          <p className="forecast-subtitle">
            AI-powered predictions based on 30-day consumption trends
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="forecast-summary">
        <div className="forecast-stat critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h4>Critical</h4>
            <p className="stat-value">
              {forecastsByType.filter(f => f.urgency === 'critical').length}
            </p>
            <small>Needs immediate attention</small>
          </div>
        </div>

        <div className="forecast-stat high">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h4>High Priority</h4>
            <p className="stat-value">
              {forecastsByType.filter(f => f.urgency === 'high').length}
            </p>
            <small>Order within 7 days</small>
          </div>
        </div>

        <div className="forecast-stat medium">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>Medium</h4>
            <p className="stat-value">
              {forecastsByType.filter(f => f.urgency === 'medium').length}
            </p>
            <small>Monitor closely</small>
          </div>
        </div>

        <div className="forecast-stat low">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h4>Sufficient</h4>
            <p className="stat-value">
              {forecastsByType.filter(f => f.urgency === 'low').length}
            </p>
            <small>Stock is adequate</small>
          </div>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="forecast-cards">
        {forecastsByType.length === 0 ? (
          <div className="no-forecast-data">
            <div className="no-data-icon">📊</div>
            <h4>No Forecast Data Available</h4>
            <p>Start logging feed consumption to generate predictions.</p>
          </div>
        ) : (
          forecastsByType.map((forecast) => {
            const daysRemaining = forecast.daysRemaining;

            return (
              <div
                key={forecast.feedType}
                className={`forecast-card ${getUrgencyClass(forecast.urgency)}`}
              >
                {/* Card Header */}
                <div className="forecast-card-header">
                  <div className="feed-info">
                    <h4>{forecast.feedType} Feed</h4>
                    <span className="feed-batch">{forecast.purchases} purchase(s) in stock</span>
                  </div>
                  <div className={`urgency-badge ${getUrgencyClass(forecast.urgency)}`}>
                    {getUrgencyIcon(forecast.urgency)} {forecast.urgency.toUpperCase()}
                  </div>
                </div>

                {/* Current Stock */}
                <div className="forecast-section">
                  <div className="section-label">Total Stock (All Purchases)</div>
                  <div className="section-value large">
                    {formatNumber(forecast.currentStock, 2)} kg
                  </div>
                  <div className="stock-progress">
                    <div
                      className="stock-progress-fill"
                      style={{
                        width: forecast.currentStock > 0 ? '100%' : '0%',
                        backgroundColor: forecast.urgency === 'critical' ? '#dc3545' :
                                       forecast.urgency === 'high' ? '#ffc107' : '#28a745'
                      }}
                    />
                  </div>
                </div>

                {/* Consumption Metrics */}
                <div className="forecast-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Avg Daily Use</span>
                    <span className="metric-value">
                      {formatNumber(forecast.avgDailyConsumption, 2)} kg/day
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Days Remaining</span>
                    <span className="metric-value">
                      {daysRemaining !== null ? `${daysRemaining} days` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Depletion Date */}
                {forecast.projectedDepletionDate && (
                  <div className="forecast-section depletion">
                    <div className="section-label">
                      {daysRemaining <= 0 ? '⚠️ Depleted' : '📅 Projected Depletion'}
                    </div>
                    <div className={`section-value ${daysRemaining <= 7 ? 'critical-date' : ''}`}>
                      {formatDate(forecast.projectedDepletionDate)}
                    </div>
                    {daysRemaining > 0 && daysRemaining <= 7 && (
                      <div className="warning-text">
                        ⚠️ Stock will run out in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}!
                      </div>
                    )}
                  </div>
                )}

                {/* Purchase Recommendation */}
                <div className="forecast-section recommendation">
                  <div className="section-label">💡 Recommended Purchase</div>
                  <div className="recommendation-content">
                    <div className="recommendation-amount">
                      <span className="amount-value">
                        {formatNumber(forecast.suggestedPurchaseQuantity, 2)} kg
                      </span>
                      <span className="amount-label">
                        ({formatNumber(forecast.suggestedPurchaseQuantity / 25, 1)} bags)
                      </span>
                    </div>
                    <div className="recommendation-note">
                      For {forecast.forecastDays}-day supply
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="forecast-actions">
                  <button 
                    className={`btn btn-block ${
                      forecast.urgency === 'critical' ? 'btn-danger' :
                      forecast.urgency === 'high' ? 'btn-warning' :
                      'btn-primary'
                    }`}
                    onClick={() => window.location.href = '#/feed-management?tab=inventory&action=add'}
                  >
                    {forecast.urgency === 'critical' ? '🚨 Order Now' :
                     forecast.urgency === 'high' ? '⚠️ Order Soon' :
                     '📦 Add to Inventory'}
                  </button>
                </div>

                {/* Urgency Message */}
                <div className="urgency-message">
                  {getUrgencyLabel(forecast.urgency)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tips Section */}
      {forecasts.length > 0 && (
        <div className="forecast-tips">
          <h4>💡 Forecasting Tips</h4>
          <ul>
            <li>Predictions are based on the last 30 days of consumption data</li>
            <li>Critical alerts indicate stock will run out within 3 days</li>
            <li>High priority alerts suggest ordering within 7 days</li>
            <li>Regular consumption logging improves forecast accuracy</li>
            <li>Seasonal variations may affect actual consumption rates</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FeedForecast;

