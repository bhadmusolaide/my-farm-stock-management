import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import './Reports.css';

const InventoryAnalysis = ({ inventoryTurnover }) => {
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548'];

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Feed Type',
      sortable: true
    },
    {
      key: 'currentStock',
      label: 'Current Stock (kg)',
      sortable: true,
      render: (row) => formatNumber(row.currentStock, 1)
    },
    {
      key: 'totalConsumed',
      label: 'Consumed (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalConsumed, 1)
    },
    {
      key: 'turnoverRate',
      label: 'Turnover Rate',
      sortable: true,
      render: (row) => `${row.turnoverRate.toFixed(2)}x`
    },
    {
      key: 'efficiency',
      label: 'Efficiency Rating',
      sortable: true,
      render: (row) => {
        const rating = row.turnoverRate >= 2 ? 'High' : row.turnoverRate >= 1 ? 'Medium' : 'Low';
        const className = rating === 'High' ? 'success' : rating === 'Medium' ? 'warning' : 'danger';
        return <span className={`efficiency-rating ${className}`}>{rating}</span>;
      }
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      sortable: true,
      render: (row) => {
        // Estimate stock value (this would need actual cost data)
        const estimatedValue = row.currentStock * 150; // Rough estimate per kg
        return formatCurrency(estimatedValue);
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status}`}>
          {row.status}
        </span>
      )
    }
  ];

  // Calculate summary statistics
  const summaryStats = {
    totalItems: inventoryTurnover.length,
    totalCurrentStock: inventoryTurnover.reduce((sum, item) => sum + item.currentStock, 0),
    totalConsumed: inventoryTurnover.reduce((sum, item) => sum + item.totalConsumed, 0),
    avgTurnoverRate: inventoryTurnover.length > 0 
      ? inventoryTurnover.reduce((sum, item) => sum + item.turnoverRate, 0) / inventoryTurnover.length 
      : 0,
    highTurnoverItems: inventoryTurnover.filter(item => item.turnoverRate >= 2).length,
    lowTurnoverItems: inventoryTurnover.filter(item => item.turnoverRate < 1).length,
    totalStockValue: inventoryTurnover.reduce((sum, item) => sum + (item.currentStock * 150), 0) // Estimated
  };

  // Categorize inventory by turnover rate
  const turnoverCategories = [
    { 
      name: 'High Turnover (≥2x)', 
      value: inventoryTurnover.filter(item => item.turnoverRate >= 2).length,
      color: '#4caf50'
    },
    { 
      name: 'Medium Turnover (1-2x)', 
      value: inventoryTurnover.filter(item => item.turnoverRate >= 1 && item.turnoverRate < 2).length,
      color: '#ff9800'
    },
    { 
      name: 'Low Turnover (<1x)', 
      value: inventoryTurnover.filter(item => item.turnoverRate < 1).length,
      color: '#f44336'
    }
  ];

  // Find best and worst performers
  const bestTurnover = inventoryTurnover.reduce((max, item) => 
    item.turnoverRate > max.turnoverRate ? item : max, inventoryTurnover[0] || {});
  
  const worstTurnover = inventoryTurnover.reduce((min, item) => 
    item.turnoverRate < min.turnoverRate ? item : min, inventoryTurnover[0] || {});

  const highestStock = inventoryTurnover.reduce((max, item) => 
    item.currentStock > max.currentStock ? item : max, inventoryTurnover[0] || {});

  // Prepare radar chart data for top performers
  const radarData = inventoryTurnover.slice(0, 5).map(item => ({
    name: item.name.split(' - ')[0], // Shorten name for radar
    turnoverRate: item.turnoverRate,
    stockLevel: Math.min(item.currentStock / 100, 10), // Scale for radar (max 10)
    consumption: Math.min(item.totalConsumed / 100, 10) // Scale for radar (max 10)
  }));

  // Calculate inventory health score
  const inventoryHealthScore = inventoryTurnover.length > 0 
    ? ((summaryStats.highTurnoverItems / inventoryTurnover.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="inventory-analysis">
      <div className="analysis-header">
        <h2>📦 Inventory Turnover Analysis</h2>
        <p>Analyze how efficiently inventory is being used and identify optimization opportunities</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Items</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalItems)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h4>Current Stock</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalCurrentStock, 1)} kg</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h4>Total Consumed</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalConsumed, 1)} kg</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Turnover Rate</h4>
              <p className="stat-value">{summaryStats.avgTurnoverRate.toFixed(2)}x</p>
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Est. Stock Value</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalStockValue)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Health Score</h4>
              <p className="stat-value">{inventoryHealthScore}%</p>
              <small>High turnover items</small>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Performance */}
      <div className="inventory-performance">
        <h3>🎯 Inventory Performance</h3>
        <div className="performance-grid">
          <div className="performance-card success">
            <div className="performance-icon">🚀</div>
            <div className="performance-content">
              <h4>High Turnover Items</h4>
              <p className="performance-value">{summaryStats.highTurnoverItems}</p>
              <small>Turnover rate ≥ 2x</small>
            </div>
          </div>

          <div className="performance-card warning">
            <div className="performance-icon">⚠️</div>
            <div className="performance-content">
              <h4>Low Turnover Items</h4>
              <p className="performance-value">{summaryStats.lowTurnoverItems}</p>
              <small>Turnover rate < 1x</small>
            </div>
          </div>

          <div className="performance-card info">
            <div className="performance-icon">📊</div>
            <div className="performance-content">
              <h4>Stock Utilization</h4>
              <p className="performance-value">
                {summaryStats.totalCurrentStock > 0 
                  ? ((summaryStats.totalConsumed / (summaryStats.totalCurrentStock + summaryStats.totalConsumed)) * 100).toFixed(1)
                  : 0
                }%
              </p>
              <small>Consumption vs total stock</small>
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-icon">🔄</div>
            <div className="performance-content">
              <h4>Inventory Velocity</h4>
              <p className="performance-value">
                {summaryStats.avgTurnoverRate >= 2 ? 'Fast' : 
                 summaryStats.avgTurnoverRate >= 1 ? 'Medium' : 'Slow'}
              </p>
              <small>Overall inventory movement</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {inventoryTurnover.length > 0 && (
          <>
            <div className="chart-container">
              <h3>📊 Inventory Turnover Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}x`, 'Turnover Rate']} />
                  <Legend />
                  <Bar dataKey="turnoverRate" fill="#ff9800" name="Turnover Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>🥧 Turnover Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={turnoverCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {turnoverCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'Items']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>📦 Stock vs Consumption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value, 1), 'kg']} />
                  <Legend />
                  <Bar dataKey="currentStock" fill="#2196f3" name="Current Stock (kg)" />
                  <Bar dataKey="totalConsumed" fill="#4caf50" name="Total Consumed (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {radarData.length > 0 && (
              <div className="chart-container">
                <h3>🎯 Top Performers Radar</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar 
                      name="Turnover Rate" 
                      dataKey="turnoverRate" 
                      stroke="#ff9800" 
                      fill="#ff9800" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Stock Level (scaled)" 
                      dataKey="stockLevel" 
                      stroke="#2196f3" 
                      fill="#2196f3" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Consumption (scaled)" 
                      dataKey="consumption" 
                      stroke="#4caf50" 
                      fill="#4caf50" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Detailed Inventory Analysis</h3>
        <DataTable
          data={inventoryTurnover}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search inventory items..."
          emptyMessage="No inventory data available"
          pageSize={10}
          storageKey="inventoryAnalysis"
        />
      </div>

      {/* Inventory Insights */}
      <div className="inventory-insights">
        <h3>💡 Inventory Insights</h3>
        <div className="insights-grid">
          {bestTurnover && (
            <div className="insight-card success">
              <div className="insight-icon">🏆</div>
              <div className="insight-content">
                <h4>Best Turnover</h4>
                <p className="insight-value">{bestTurnover.name.split(' - ')[0]}</p>
                <small>Rate: {bestTurnover.turnoverRate.toFixed(2)}x</small>
              </div>
            </div>
          )}

          {worstTurnover && (
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h4>Needs Attention</h4>
                <p className="insight-value">{worstTurnover.name.split(' - ')[0]}</p>
                <small>Rate: {worstTurnover.turnoverRate.toFixed(2)}x</small>
              </div>
            </div>
          )}

          {highestStock && (
            <div className="insight-card info">
              <div className="insight-icon">📦</div>
              <div className="insight-content">
                <h4>Highest Stock</h4>
                <p className="insight-value">{highestStock.name.split(' - ')[0]}</p>
                <small>Stock: {formatNumber(highestStock.currentStock, 1)} kg</small>
              </div>
            </div>
          )}

          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Optimization Potential</h4>
              <p className="insight-value">
                {summaryStats.lowTurnoverItems > 0 ? 'High' : 'Low'}
              </p>
              <small>
                {summaryStats.lowTurnoverItems} items need optimization
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="inventory-recommendations">
        <h3>💡 Recommendations</h3>
        <div className="recommendations-list">
          {summaryStats.lowTurnoverItems > 0 && (
            <div className="recommendation-item warning">
              <div className="recommendation-icon">⚠️</div>
              <div className="recommendation-content">
                <h4>Reduce Slow-Moving Stock</h4>
                <p>Consider reducing orders for {summaryStats.lowTurnoverItems} items with low turnover rates to free up capital and storage space.</p>
              </div>
            </div>
          )}

          {summaryStats.highTurnoverItems > 0 && (
            <div className="recommendation-item success">
              <div className="recommendation-icon">✅</div>
              <div className="recommendation-content">
                <h4>Maintain High Performers</h4>
                <p>Continue current ordering patterns for {summaryStats.highTurnoverItems} high-turnover items as they show efficient utilization.</p>
              </div>
            </div>
          )}

          {summaryStats.avgTurnoverRate < 1 && (
            <div className="recommendation-item info">
              <div className="recommendation-icon">📊</div>
              <div className="recommendation-content">
                <h4>Improve Overall Efficiency</h4>
                <p>Overall turnover rate is below 1x. Consider reviewing ordering quantities and consumption patterns to improve efficiency.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalysis;
