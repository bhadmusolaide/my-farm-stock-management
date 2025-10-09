import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import './Reports.css';

const FeedEfficiencyAnalysis = ({ feedEfficiency }) => {
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548'];

  // Table columns configuration
  const columns = [
    {
      key: 'feedType',
      label: 'Feed Type',
      sortable: true
    },
    {
      key: 'brand',
      label: 'Brand',
      sortable: true
    },
    {
      key: 'totalConsumed',
      label: 'Total Consumed (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalConsumed, 1)
    },
    {
      key: 'totalChickens',
      label: 'Chickens Fed',
      sortable: true,
      render: (row) => formatNumber(row.totalChickens)
    },
    {
      key: 'efficiency',
      label: 'Efficiency (Chickens/kg)',
      sortable: true,
      render: (row) => row.efficiency.toFixed(2)
    },
    {
      key: 'costEfficiency',
      label: 'Cost Efficiency (Revenue/kg)',
      sortable: true,
      render: (row) => formatCurrency(row.costEfficiency)
    },
    {
      key: 'fcr',
      label: 'FCR (kg/chicken)',
      sortable: true,
      render: (row) => (row.efficiency > 0 ? (1 / row.efficiency).toFixed(3) : 'N/A')
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
    totalFeedTypes: feedEfficiency.length,
    totalConsumed: feedEfficiency.reduce((sum, feed) => sum + feed.totalConsumed, 0),
    totalChickens: feedEfficiency.reduce((sum, feed) => sum + feed.totalChickens, 0),
    avgEfficiency: feedEfficiency.length > 0 
      ? feedEfficiency.reduce((sum, feed) => sum + feed.efficiency, 0) / feedEfficiency.length 
      : 0,
    avgCostEfficiency: feedEfficiency.length > 0
      ? feedEfficiency.reduce((sum, feed) => sum + feed.costEfficiency, 0) / feedEfficiency.length
      : 0,
    totalRevenue: feedEfficiency.reduce((sum, feed) => sum + (feed.costEfficiency * feed.totalConsumed), 0)
  };

  // Find best and worst performers
  const bestEfficiency = feedEfficiency.reduce((max, feed) => 
    feed.efficiency > max.efficiency ? feed : max, feedEfficiency[0] || {});
  
  const worstEfficiency = feedEfficiency.reduce((min, feed) => 
    feed.efficiency < min.efficiency && feed.efficiency > 0 ? feed : min, feedEfficiency[0] || {});

  const bestCostEfficiency = feedEfficiency.reduce((max, feed) => 
    feed.costEfficiency > max.costEfficiency ? feed : max, feedEfficiency[0] || {});

  // Prepare data for feed type distribution
  const feedTypeDistribution = {};
  feedEfficiency.forEach(feed => {
    if (!feedTypeDistribution[feed.feedType]) {
      feedTypeDistribution[feed.feedType] = {
        name: feed.feedType,
        totalConsumed: 0,
        totalChickens: 0,
        brands: new Set()
      };
    }
    feedTypeDistribution[feed.feedType].totalConsumed += feed.totalConsumed;
    feedTypeDistribution[feed.feedType].totalChickens += feed.totalChickens;
    feedTypeDistribution[feed.feedType].brands.add(feed.brand);
  });

  const feedTypeData = Object.values(feedTypeDistribution).map(type => ({
    ...type,
    brands: type.brands.size
  }));

  // Prepare scatter plot data for efficiency vs cost efficiency
  const scatterData = feedEfficiency.map(feed => ({
    x: feed.efficiency,
    y: feed.costEfficiency,
    name: `${feed.feedType} - ${feed.brand}`,
    totalConsumed: feed.totalConsumed
  }));

  return (
    <div className="feed-efficiency-analysis">
      <div className="analysis-header">
        <h2>🌾 Feed Efficiency Analysis</h2>
        <p>Compare feed efficiency across different feed types and brands</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Feed Types</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalFeedTypes)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <h4>Total Consumed</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalConsumed, 1)} kg</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">🐔</div>
            <div className="stat-content">
              <h4>Chickens Fed</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalChickens)}</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Efficiency</h4>
              <p className="stat-value">{summaryStats.avgEfficiency.toFixed(2)} chickens/kg</p>
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Avg Cost Efficiency</h4>
              <p className="stat-value">{formatCurrency(summaryStats.avgCostEfficiency)}/kg</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Overall FCR</h4>
              <p className="stat-value">
                {summaryStats.totalChickens > 0 
                  ? (summaryStats.totalConsumed / summaryStats.totalChickens).toFixed(3)
                  : 'N/A'
                } kg/chicken
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {feedEfficiency.length > 0 && (
          <>
            <div className="chart-container">
              <h3>📊 Feed Efficiency Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feedType" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'efficiency') {
                      return [value.toFixed(2), 'Chickens/kg'];
                    }
                    return [formatNumber(value, 1), name === 'totalConsumed' ? 'kg' : 'Chickens'];
                  }} />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#ff9800" name="Efficiency (Chickens/kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>💰 Feed Cost Efficiency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feedType" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue/kg']} />
                  <Legend />
                  <Bar dataKey="costEfficiency" fill="#9c27b0" name="Cost Efficiency (Revenue/kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>🥧 Feed Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalConsumed"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {feedTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value, 1), 'kg Consumed']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {scatterData.length > 0 && (
              <div className="chart-container">
                <h3>📈 Efficiency vs Cost Efficiency</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      name="Efficiency" 
                      unit=" chickens/kg"
                      label={{ value: 'Efficiency (chickens/kg)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="y" 
                      name="Cost Efficiency" 
                      unit="/kg"
                      label={{ value: 'Cost Efficiency (₦/kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Efficiency') return [value.toFixed(2), 'chickens/kg'];
                        if (name === 'Cost Efficiency') return [formatCurrency(value), '/kg'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.name;
                        }
                        return label;
                      }}
                    />
                    <Scatter dataKey="y" fill="#2196f3" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Detailed Feed Analysis</h3>
        <DataTable
          data={feedEfficiency}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search feed types..."
          emptyMessage="No feed efficiency data available"
          pageSize={10}
          storageKey="feedEfficiency"
        />
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <h3>💡 Feed Performance Insights</h3>
        <div className="insights-grid">
          {bestEfficiency && (
            <div className="insight-card success">
              <div className="insight-icon">🏆</div>
              <div className="insight-content">
                <h4>Most Efficient Feed</h4>
                <p className="insight-value">{bestEfficiency.feedType}</p>
                <small>Brand: {bestEfficiency.brand}</small>
                <small>Efficiency: {bestEfficiency.efficiency.toFixed(2)} chickens/kg</small>
              </div>
            </div>
          )}

          {worstEfficiency && worstEfficiency.efficiency > 0 && (
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h4>Least Efficient Feed</h4>
                <p className="insight-value">{worstEfficiency.feedType}</p>
                <small>Brand: {worstEfficiency.brand}</small>
                <small>Efficiency: {worstEfficiency.efficiency.toFixed(2)} chickens/kg</small>
              </div>
            </div>
          )}

          {bestCostEfficiency && (
            <div className="insight-card info">
              <div className="insight-icon">💰</div>
              <div className="insight-content">
                <h4>Best Cost Efficiency</h4>
                <p className="insight-value">{bestCostEfficiency.feedType}</p>
                <small>Brand: {bestCostEfficiency.brand}</small>
                <small>Revenue: {formatCurrency(bestCostEfficiency.costEfficiency)}/kg</small>
              </div>
            </div>
          )}

          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Feed Conversion Rate</h4>
              <p className="insight-value">
                {summaryStats.avgEfficiency > 0 
                  ? (1 / summaryStats.avgEfficiency).toFixed(3)
                  : 'N/A'
                }
              </p>
              <small>kg feed per chicken (avg)</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedEfficiencyAnalysis;
