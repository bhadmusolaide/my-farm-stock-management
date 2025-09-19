import React from 'react';
import './FeedDashboardOverview.css';

const FeedDashboardOverview = ({ 
  feedInventory, 
  liveChickens, 
  feedConsumption, 
  feedBatchAssignments,
  calculateFCR,
  getCurrentFeedStage,
  formatNumber 
}) => {
  // Calculate dashboard metrics
  const totalFeedStock = feedInventory.reduce((sum, item) => sum + item.quantity_kg, 0);
  const activeBatches = liveChickens.filter(batch => batch.status === 'active').length;
  
  // Calculate monthly consumption
  const monthlyConsumption = feedConsumption
    .filter(item => {
      const itemDate = new Date(item.consumption_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return itemDate >= monthAgo;
    })
    .reduce((sum, item) => sum + item.quantity_consumed, 0);

  // Calculate low stock alerts (feeds with less than 100kg)
  const lowStockFeeds = feedInventory.filter(feed => 
    feed.quantity_kg < 100 && feed.status === 'active'
  );

  // Calculate average FCR across all batches
  const avgFCR = liveChickens.length > 0 
    ? liveChickens.reduce((sum, batch) => sum + parseFloat(calculateFCR(batch.id) || 0), 0) / liveChickens.length
    : 0;

  // Calculate feeds expiring soon (within 30 days)
  const expiringSoon = feedInventory.filter(feed => {
    const expiryDate = new Date(feed.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && feed.status === 'active';
  });

  // Calculate unassigned feeds
  const assignedFeedIds = feedBatchAssignments.map(assignment => assignment.feed_id);
  const unassignedFeeds = feedInventory.filter(feed => 
    !assignedFeedIds.includes(feed.id) && feed.status === 'active'
  );

  // Calculate feed efficiency trend (comparing current month vs previous month)
  const currentMonth = new Date();
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const currentMonthConsumption = feedConsumption
    .filter(item => {
      const itemDate = new Date(item.consumption_date);
      return itemDate >= previousMonth && itemDate < currentMonth;
    })
    .reduce((sum, item) => sum + item.quantity_consumed, 0);

  const previousMonthConsumption = feedConsumption
    .filter(item => {
      const itemDate = new Date(item.consumption_date);
      return itemDate >= twoMonthsAgo && itemDate < previousMonth;
    })
    .reduce((sum, item) => sum + item.quantity_consumed, 0);

  const efficiencyTrend = previousMonthConsumption > 0 
    ? ((currentMonthConsumption - previousMonthConsumption) / previousMonthConsumption * 100)
    : 0;

  return (
    <div className="feed-dashboard-overview">
      <h2>Feed Management Dashboard</h2>
      
      {/* Key Metrics Cards */}
      <div className="dashboard-metrics">
        <div className="metric-card primary">
          <div className="metric-icon">🏭</div>
          <div className="metric-content">
            <h3>Total Feed Stock</h3>
            <p className="metric-value">{formatNumber(totalFeedStock)} kg</p>
            <span className="metric-subtitle">Across all feed types</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">🐔</div>
          <div className="metric-content">
            <h3>Active Batches</h3>
            <p className="metric-value">{activeBatches}</p>
            <span className="metric-subtitle">Requiring feed management</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>Low Stock Alerts</h3>
            <p className="metric-value">{lowStockFeeds.length}</p>
            <span className="metric-subtitle">Feeds below 100kg</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Average FCR</h3>
            <p className="metric-value">{avgFCR.toFixed(2)}:1</p>
            <span className="metric-subtitle">Feed conversion ratio</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="secondary-metrics">
        <div className="secondary-metric">
          <h4>Monthly Consumption</h4>
          <p className="value">{formatNumber(monthlyConsumption)} kg</p>
          <span className={`trend ${efficiencyTrend >= 0 ? 'up' : 'down'}`}>
            {efficiencyTrend >= 0 ? '↗️' : '↘️'} {Math.abs(efficiencyTrend).toFixed(1)}% vs last month
          </span>
        </div>

        <div className="secondary-metric">
          <h4>Expiring Soon</h4>
          <p className="value">{expiringSoon.length}</p>
          <span className="subtitle">Feeds expiring in 30 days</span>
        </div>

        <div className="secondary-metric">
          <h4>Unassigned Feeds</h4>
          <p className="value">{unassignedFeeds.length}</p>
          <span className="subtitle">Available for assignment</span>
        </div>
      </div>

      {/* Quick Alerts */}
      {(lowStockFeeds.length > 0 || expiringSoon.length > 0) && (
        <div className="quick-alerts">
          <h3>⚡ Quick Alerts</h3>
          <div className="alerts-grid">
            {lowStockFeeds.length > 0 && (
              <div className="alert-item low-stock">
                <span className="alert-icon">📉</span>
                <div className="alert-content">
                  <h4>Low Stock Warning</h4>
                  <p>{lowStockFeeds.length} feed type(s) running low</p>
                  <small>Consider reordering soon</small>
                </div>
              </div>
            )}
            
            {expiringSoon.length > 0 && (
              <div className="alert-item expiring">
                <span className="alert-icon">⏰</span>
                <div className="alert-content">
                  <h4>Expiry Alert</h4>
                  <p>{expiringSoon.length} feed(s) expiring soon</p>
                  <small>Use within 30 days</small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feed Stage Distribution */}
      <div className="feed-stage-distribution">
        <h3>Feed Stage Distribution</h3>
        <div className="stage-cards">
          {['Starter', 'Grower', 'Finisher', 'Layer'].map(stage => {
            const batchesInStage = liveChickens.filter(batch => {
              const currentStage = getCurrentFeedStage(batch);
              return currentStage.stage === stage;
            });
            
            const feedForStage = feedInventory.filter(feed => 
              feed.feed_type === stage && feed.status === 'active'
            );
            
            const totalStageStock = feedForStage.reduce((sum, feed) => sum + feed.quantity_kg, 0);

            return (
              <div key={stage} className="stage-card">
                <h4>{stage} Feed</h4>
                <div className="stage-stats">
                  <p><strong>{batchesInStage.length}</strong> batches</p>
                  <p><strong>{formatNumber(totalStageStock)} kg</strong> stock</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedDashboardOverview;