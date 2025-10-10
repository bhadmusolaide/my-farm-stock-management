import { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { formatNumber } from '../utils/formatters';
import './UnifiedInventoryDashboard.css';

const UnifiedInventoryDashboard = () => {
  const { 
    liveChickens, 
    feedInventory, 
    dressedChickens, 
    chickenInventoryTransactions 
  } = useAppContext();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for filters
  const [filters, setFilters] = useState({
    alertType: 'all',
    timeRange: '30'
  });

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    // Live chickens stats
    const totalLiveChickens = liveChickens?.reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    const healthyLiveChickens = liveChickens?.filter(batch => batch.status === 'healthy')
      .reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    const processingReadyChickens = liveChickens?.filter(batch => batch.status === 'processing')
      .reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    
    // Feed inventory stats
    const totalFeedKg = feedInventory?.reduce((sum, feed) => sum + feed.quantity_kg, 0) || 0;
    const activeFeedItems = feedInventory?.filter(feed => feed.status === 'active').length || 0;
    const expiringSoonFeed = feedInventory?.filter(feed => {
      if (feed.expiry_date && feed.status === 'active') {
        const expiryDate = new Date(feed.expiry_date);
        const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 7; // Within 7 days
      }
      return false;
    }).length || 0;
    
    // Dressed chickens stats
    const totalDressedChickens = dressedChickens?.reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    const inStorageDressed = dressedChickens?.filter(batch => batch.status === 'in-storage')
      .reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    const expiringSoonDressed = dressedChickens?.filter(batch => {
      if (batch.expiry_date && batch.status === 'in-storage') {
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 3; // Within 3 days
      }
      return false;
    }).reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    
    return {
      liveChickens: {
        total: totalLiveChickens,
        healthy: healthyLiveChickens,
        processingReady: processingReadyChickens,
        mortalityRate: totalLiveChickens > 0 ? 
          ((totalLiveChickens - healthyLiveChickens - processingReadyChickens) / totalLiveChickens * 100).toFixed(1) : '0.0'
      },
      feed: {
        totalKg: totalFeedKg,
        activeItems: activeFeedItems,
        expiringSoon: expiringSoonFeed,
        lowStockItems: feedInventory?.filter(feed => feed.quantity_kg < 50 && feed.status === 'active').length || 0
      },
      dressedChickens: {
        total: totalDressedChickens,
        inStorage: inStorageDressed,
        expiringSoon: expiringSoonDressed,
        utilizationRate: totalDressedChickens > 0 ? 
          (inStorageDressed / totalDressedChickens * 100).toFixed(1) : '0.0'
      }
    };
  }, [liveChickens, feedInventory, dressedChickens]);

  // Calculate projected feed needs vs current inventory
  const feedProjection = useMemo(() => {
    // This is a simplified projection - in a real system, this would be more complex
    // based on chicken count, age, breed, and feed consumption rates
    const dailyFeedConsumptionPerChicken = 0.15; // kg per chicken per day
    const totalLiveChickens = liveChickens?.reduce((sum, batch) => sum + batch.current_count, 0) || 0;
    
    const projectedDailyConsumption = totalLiveChickens * dailyFeedConsumptionPerChicken;
    const totalFeedKg = feedInventory?.reduce((sum, feed) => sum + feed.quantity_kg, 0) || 0;
    
    const daysOfFeedRemaining = projectedDailyConsumption > 0 ? 
      (totalFeedKg / projectedDailyConsumption).toFixed(1) : '0.0';
    
    return {
      dailyConsumption: projectedDailyConsumption,
      totalFeed: totalFeedKg,
      daysRemaining: parseFloat(daysOfFeedRemaining),
      status: daysOfFeedRemaining < 7 ? 'critical' : daysOfFeedRemaining < 14 ? 'warning' : 'ok'
    };
  }, [liveChickens, feedInventory]);

  // Get low stock alerts
  const lowStockAlerts = useMemo(() => {
    const alerts = [];
    
    // Feed low stock alerts
    feedInventory?.forEach(feed => {
      if (feed.quantity_kg < 50 && feed.status === 'active') {
        alerts.push({
          id: `feed-${feed.id}`,
          type: 'feed',
          severity: feed.quantity_kg < 20 ? 'critical' : 'warning',
          message: `Low feed stock: ${feed.feed_type} (${formatNumber(feed.quantity_kg, 1)} kg remaining)`,
          batchId: feed.id
        });
      }
      
      // Expiring soon alerts
      if (feed.expiry_date && feed.status === 'active') {
        const expiryDate = new Date(feed.expiry_date);
        const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry <= 7) {
          alerts.push({
            id: `feed-expiry-${feed.id}`,
            type: 'feed',
            severity: daysUntilExpiry <= 3 ? 'critical' : 'warning',
            message: `Feed expiring soon: ${feed.feed_type} expires in ${Math.ceil(daysUntilExpiry)} days`,
            batchId: feed.id
          });
        }
      }
    });
    
    // Dressed chicken expiring soon alerts
    dressedChickens?.forEach(batch => {
      if (batch.expiry_date && batch.status === 'in-storage') {
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry <= 3) {
          alerts.push({
            id: `dressed-expiry-${batch.id}`,
            type: 'dressed',
            severity: daysUntilExpiry <= 1 ? 'critical' : 'warning',
            message: `Dressed chickens expiring soon: Batch ${batch.batch_id} expires in ${Math.ceil(daysUntilExpiry)} days`,
            batchId: batch.id
          });
        }
      }
    });
    
    return alerts;
  }, [feedInventory, dressedChickens]);

  // Filter alerts based on selected filter
  const filteredAlerts = useMemo(() => {
    if (filters.alertType === 'all') return lowStockAlerts;
    return lowStockAlerts.filter(alert => alert.type === filters.alertType);
  }, [lowStockAlerts, filters.alertType]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="unified-inventory-dashboard">
      <div className="page-header">
        <h1>Unified Inventory Dashboard</h1>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feed-projection' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed-projection')}
        >
          Feed Projection
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Low Stock Alerts
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            {/* Live Chickens Card */}
            <div className="summary-card">
              <div className="card-header">
                <h3>Live Chickens</h3>
                <span className="card-icon">🐔</span>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{formatNumber(inventoryStats.liveChickens.total)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Healthy</span>
                  <span className="stat-value">{formatNumber(inventoryStats.liveChickens.healthy)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ready for Processing</span>
                  <span className="stat-value">{formatNumber(inventoryStats.liveChickens.processingReady)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mortality Rate</span>
                  <span className="stat-value">{inventoryStats.liveChickens.mortalityRate}%</span>
                </div>
              </div>
            </div>
            
            {/* Feed Inventory Card */}
            <div className="summary-card">
              <div className="card-header">
                <h3>Feed Inventory</h3>
                <span className="card-icon">🌾</span>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total Stock</span>
                  <span className="stat-value">{formatNumber(inventoryStats.feed.totalKg, 1)} kg</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Items</span>
                  <span className="stat-value">{inventoryStats.feed.activeItems}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Expiring Soon</span>
                  <span className="stat-value">{inventoryStats.feed.expiringSoon}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Low Stock Items</span>
                  <span className="stat-value">{inventoryStats.feed.lowStockItems}</span>
                </div>
              </div>
            </div>
            
            {/* Dressed Chickens Card */}
            <div className="summary-card">
              <div className="card-header">
                <h3>Dressed Chickens</h3>
                <span className="card-icon">🍗</span>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{formatNumber(inventoryStats.dressedChickens.total)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">In Storage</span>
                  <span className="stat-value">{formatNumber(inventoryStats.dressedChickens.inStorage)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Expiring Soon</span>
                  <span className="stat-value">{formatNumber(inventoryStats.dressedChickens.expiringSoon)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Utilization Rate</span>
                  <span className="stat-value">{inventoryStats.dressedChickens.utilizationRate}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feed Projection Summary */}
          <div className="projection-summary">
            <h3>Feed Stock Status</h3>
            <div className={`projection-status ${feedProjection.status}`}>
              <p>
                Current feed inventory of {formatNumber(feedProjection.totalFeed, 1)} kg will last approximately 
                <strong> {feedProjection.daysRemaining} days</strong> at current consumption rate.
              </p>
              {feedProjection.status === 'critical' && (
                <p className="status-message critical">⚠️ Critical: Order more feed immediately!</p>
              )}
              {feedProjection.status === 'warning' && (
                <p className="status-message warning">⚠️ Warning: Consider ordering more feed soon.</p>
              )}
              {feedProjection.status === 'ok' && (
                <p className="status-message ok">✅ Feed stock is sufficient for now.</p>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Feed Projection Tab */}
      {activeTab === 'feed-projection' && (
        <div className="feed-projection-container">
          <h3>Projected Feed Needs vs. Current Inventory</h3>
          
          <div className="projection-details">
            <div className="projection-card">
              <h4>Current Inventory</h4>
              <div className="stat-item">
                <span className="stat-label">Total Feed Stock</span>
                <span className="stat-value">{formatNumber(feedProjection.totalFeed, 1)} kg</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Feed Items</span>
                <span className="stat-value">{inventoryStats.feed.activeItems}</span>
              </div>
            </div>
            
            <div className="projection-card">
              <h4>Projected Consumption</h4>
              <div className="stat-item">
                <span className="stat-label">Daily Consumption</span>
                <span className="stat-value">{formatNumber(feedProjection.dailyConsumption, 2)} kg/day</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Days of Feed Remaining</span>
                <span className={`stat-value ${feedProjection.status}`}>
                  {feedProjection.daysRemaining} days
                </span>
              </div>
            </div>
          </div>
          
          <div className="feed-breakdown">
            <h4>Feed Inventory Breakdown</h4>
            <div className="table-container">
              <table className="feed-table">
                <thead>
                  <tr>
                    <th>Feed Type</th>
                    <th>Brand</th>
                    <th>Quantity (kg)</th>
                    <th>Status</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedInventory?.map(feed => {
                    const isExpiringSoon = feed.expiry_date && new Date(feed.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    const isLowStock = feed.quantity_kg < 50;
                    
                    return (
                      <tr key={feed.id}>
                        <td>{feed.feed_type}</td>
                        <td>{feed.brand}</td>
                        <td className={isLowStock ? 'low-stock' : ''}>{formatNumber(feed.quantity_kg, 1)}</td>
                        <td>
                          <span className={`status-badge ${feed.status}`}>
                            {feed.status}
                          </span>
                        </td>
                        <td className={isExpiringSoon ? 'expiring-soon' : ''}>
                          {feed.expiry_date || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="alerts-container">
          <div className="alerts-header">
            <h3>Low Stock Alerts</h3>
            <div className="alerts-filters">
              <select
                name="alertType"
                value={filters.alertType}
                onChange={handleFilterChange}
              >
                <option value="all">All Alerts</option>
                <option value="feed">Feed Only</option>
                <option value="dressed">Dressed Chickens Only</option>
              </select>
            </div>
          </div>
          
          {filteredAlerts.length > 0 ? (
            <div className="alerts-list">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                  <div className="alert-content">
                    <span className="alert-icon">
                      {alert.severity === 'critical' ? '🔴' : '🟡'}
                    </span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-alerts">
              <p>No low stock alerts at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedInventoryDashboard;