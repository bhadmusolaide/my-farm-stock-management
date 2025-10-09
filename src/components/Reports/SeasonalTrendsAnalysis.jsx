import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import './Reports.css';

const SeasonalTrendsAnalysis = ({ seasonalTrends }) => {
  // Table columns configuration
  const columns = [
    {
      key: 'month',
      label: 'Month',
      sortable: true
    },
    {
      key: 'year',
      label: 'Year',
      sortable: true
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (row) => formatCurrency(row.revenue)
    },
    {
      key: 'chickens',
      label: 'Chickens Sold',
      sortable: true,
      render: (row) => formatNumber(row.chickens)
    },
    {
      key: 'avgSize',
      label: 'Avg Size (kg)',
      sortable: true,
      render: (row) => `${row.avgSize.toFixed(2)} kg`
    },
    {
      key: 'orders',
      label: 'Orders',
      sortable: true,
      render: (row) => formatNumber(row.orders)
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      sortable: true,
      render: (row) => formatCurrency(row.orders > 0 ? row.revenue / row.orders : 0)
    }
  ];

  // Calculate summary statistics
  const summaryStats = {
    totalMonths: seasonalTrends.length,
    totalRevenue: seasonalTrends.reduce((sum, trend) => sum + trend.revenue, 0),
    totalChickens: seasonalTrends.reduce((sum, trend) => sum + trend.chickens, 0),
    totalOrders: seasonalTrends.reduce((sum, trend) => sum + trend.orders, 0),
    avgMonthlyRevenue: seasonalTrends.length > 0 
      ? seasonalTrends.reduce((sum, trend) => sum + trend.revenue, 0) / seasonalTrends.length 
      : 0,
    avgChickensPerMonth: seasonalTrends.length > 0
      ? seasonalTrends.reduce((sum, trend) => sum + trend.chickens, 0) / seasonalTrends.length
      : 0,
    avgOrderSize: seasonalTrends.reduce((sum, trend) => sum + trend.avgSize, 0) / (seasonalTrends.length || 1)
  };

  // Find peak and low seasons
  const peakRevenueMonth = seasonalTrends.reduce((max, trend) => 
    trend.revenue > max.revenue ? trend : max, seasonalTrends[0] || {});
  
  const lowRevenueMonth = seasonalTrends.reduce((min, trend) => 
    trend.revenue < min.revenue ? trend : min, seasonalTrends[0] || {});

  const peakSalesMonth = seasonalTrends.reduce((max, trend) => 
    trend.chickens > max.chickens ? trend : max, seasonalTrends[0] || {});

  // Calculate growth trends
  const growthTrends = seasonalTrends.map((trend, index) => {
    if (index === 0) return { ...trend, revenueGrowth: 0, salesGrowth: 0 };
    
    const prevTrend = seasonalTrends[index - 1];
    const revenueGrowth = prevTrend.revenue > 0 
      ? ((trend.revenue - prevTrend.revenue) / prevTrend.revenue) * 100 
      : 0;
    const salesGrowth = prevTrend.chickens > 0 
      ? ((trend.chickens - prevTrend.chickens) / prevTrend.chickens) * 100 
      : 0;
    
    return { ...trend, revenueGrowth, salesGrowth };
  });

  return (
    <div className="seasonal-trends-analysis">
      <div className="analysis-header">
        <h2>📅 Seasonal Performance Trends</h2>
        <p>Analyze performance patterns across different months and seasons</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Months</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalMonths)}</p>
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Total Revenue</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalRevenue)}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">🐔</div>
            <div className="stat-content">
              <h4>Total Chickens Sold</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalChickens)}</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Monthly Revenue</h4>
              <p className="stat-value">{formatCurrency(summaryStats.avgMonthlyRevenue)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h4>Avg Chickens/Month</h4>
              <p className="stat-value">{formatNumber(summaryStats.avgChickensPerMonth)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <h4>Avg Order Size</h4>
              <p className="stat-value">{summaryStats.avgOrderSize.toFixed(2)} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {seasonalTrends.length > 0 && (
          <>
            <div className="chart-container">
              <h3>📈 Monthly Revenue Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4caf50" 
                    name="Revenue" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>🐔 Chickens Sold by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Chickens']} />
                  <Legend />
                  <Bar dataKey="chickens" fill="#ff9800" name="Chickens Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>📊 Revenue vs Sales Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    return [formatNumber(value), 'Chickens'];
                  }} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#4caf50" 
                    fill="#4caf50" 
                    fillOpacity={0.3} 
                    name="Revenue" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="chickens" 
                    stackId="2" 
                    stroke="#ff9800" 
                    fill="#ff9800" 
                    fillOpacity={0.3} 
                    name="Chickens Sold" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {growthTrends.length > 1 && (
              <div className="chart-container">
                <h3>📈 Growth Trends (Month-over-Month)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthTrends.slice(1)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Growth']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenueGrowth" 
                      stroke="#2196f3" 
                      name="Revenue Growth %" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="salesGrowth" 
                      stroke="#9c27b0" 
                      name="Sales Growth %" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Detailed Monthly Analysis</h3>
        <DataTable
          data={seasonalTrends}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search months..."
          emptyMessage="No seasonal data available"
          pageSize={12}
          storageKey="seasonalTrends"
        />
      </div>

      {/* Seasonal Insights */}
      <div className="seasonal-insights">
        <h3>🔍 Seasonal Insights</h3>
        <div className="insights-grid">
          {peakRevenueMonth && (
            <div className="insight-card success">
              <div className="insight-icon">🏆</div>
              <div className="insight-content">
                <h4>Peak Revenue Month</h4>
                <p className="insight-value">{peakRevenueMonth.month} {peakRevenueMonth.year}</p>
                <small>Revenue: {formatCurrency(peakRevenueMonth.revenue)}</small>
              </div>
            </div>
          )}

          {lowRevenueMonth && (
            <div className="insight-card warning">
              <div className="insight-icon">📉</div>
              <div className="insight-content">
                <h4>Lowest Revenue Month</h4>
                <p className="insight-value">{lowRevenueMonth.month} {lowRevenueMonth.year}</p>
                <small>Revenue: {formatCurrency(lowRevenueMonth.revenue)}</small>
              </div>
            </div>
          )}

          {peakSalesMonth && (
            <div className="insight-card info">
              <div className="insight-icon">🐔</div>
              <div className="insight-content">
                <h4>Peak Sales Month</h4>
                <p className="insight-value">{peakSalesMonth.month} {peakSalesMonth.year}</p>
                <small>Chickens: {formatNumber(peakSalesMonth.chickens)}</small>
              </div>
            </div>
          )}

          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Revenue Variance</h4>
              <p className="insight-value">
                {peakRevenueMonth && lowRevenueMonth 
                  ? `${(((peakRevenueMonth.revenue - lowRevenueMonth.revenue) / lowRevenueMonth.revenue) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </p>
              <small>Peak vs Low month</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalTrendsAnalysis;
