import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import './Reports.css';

const CustomerAnalysis = ({ customerLifetimeValue }) => {
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548'];

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      sortable: true,
      render: (row) => formatCurrency(row.totalRevenue)
    },
    {
      key: 'totalOrders',
      label: 'Total Orders',
      sortable: true,
      render: (row) => formatNumber(row.totalOrders)
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Order Value',
      sortable: true,
      render: (row) => formatCurrency(row.avgOrderValue)
    },
    {
      key: 'frequency',
      label: 'Frequency (orders/month)',
      sortable: true,
      render: (row) => row.frequency.toFixed(1)
    },
    {
      key: 'clv',
      label: 'Customer Lifetime Value',
      sortable: true,
      render: (row) => formatCurrency(row.clv)
    },
    {
      key: 'retentionRate',
      label: 'Retention Rate',
      sortable: true,
      render: (row) => `${row.retentionRate.toFixed(1)}%`
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding Balance',
      sortable: true,
      render: (row) => (
        <span className={row.outstandingBalance > 0 ? 'negative' : ''}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      )
    }
  ];

  // Calculate summary statistics
  const summaryStats = {
    totalCustomers: customerLifetimeValue.length,
    totalRevenue: customerLifetimeValue.reduce((sum, customer) => sum + customer.totalRevenue, 0),
    totalOrders: customerLifetimeValue.reduce((sum, customer) => sum + customer.totalOrders, 0),
    avgCLV: customerLifetimeValue.length > 0 
      ? customerLifetimeValue.reduce((sum, customer) => sum + customer.clv, 0) / customerLifetimeValue.length 
      : 0,
    avgRetention: customerLifetimeValue.length > 0
      ? customerLifetimeValue.reduce((sum, customer) => sum + customer.retentionRate, 0) / customerLifetimeValue.length
      : 0,
    totalOutstanding: customerLifetimeValue.reduce((sum, customer) => sum + customer.outstandingBalance, 0),
    avgOrderValue: customerLifetimeValue.length > 0
      ? customerLifetimeValue.reduce((sum, customer) => sum + customer.avgOrderValue, 0) / customerLifetimeValue.length
      : 0
  };

  // Customer segmentation
  const highValueCustomers = customerLifetimeValue.filter(customer => customer.clv > summaryStats.avgCLV);
  const loyalCustomers = customerLifetimeValue.filter(customer => customer.retentionRate > 50);
  const atRiskCustomers = customerLifetimeValue.filter(customer => 
    customer.outstandingBalance > customer.avgOrderValue && customer.frequency < 1
  );

  // Prepare data for customer value distribution
  const valueSegments = [
    { name: 'High Value (>Avg CLV)', value: highValueCustomers.length, color: '#4caf50' },
    { name: 'Regular Value', value: customerLifetimeValue.length - highValueCustomers.length, color: '#ff9800' }
  ];

  // Prepare scatter plot data for CLV vs Retention
  const scatterData = customerLifetimeValue.map(customer => ({
    x: customer.retentionRate,
    y: customer.clv,
    name: customer.name,
    totalRevenue: customer.totalRevenue
  }));

  return (
    <div className="customer-analysis">
      <div className="analysis-header">
        <h2>👥 Customer Lifetime Value Analysis</h2>
        <p>Track customer value, retention metrics, and identify key customer segments</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>Total Customers</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalCustomers)}</p>
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
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h4>Total Orders</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalOrders)}</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Avg Customer CLV</h4>
              <p className="stat-value">{formatCurrency(summaryStats.avgCLV)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Retention Rate</h4>
              <p className="stat-value">{summaryStats.avgRetention.toFixed(1)}%</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <h4>Outstanding Balance</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalOutstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="customer-segments">
        <h3>🎯 Customer Segments</h3>
        <div className="segments-grid">
          <div className="segment-card success">
            <div className="segment-icon">⭐</div>
            <div className="segment-content">
              <h4>High Value Customers</h4>
              <p className="segment-value">{highValueCustomers.length}</p>
              <small>CLV above average ({formatCurrency(summaryStats.avgCLV)})</small>
            </div>
          </div>

          <div className="segment-card info">
            <div className="segment-icon">🤝</div>
            <div className="segment-content">
              <h4>Loyal Customers</h4>
              <p className="segment-value">{loyalCustomers.length}</p>
              <small>Retention rate > 50%</small>
            </div>
          </div>

          <div className="segment-card warning">
            <div className="segment-icon">⚠️</div>
            <div className="segment-content">
              <h4>At-Risk Customers</h4>
              <p className="segment-value">{atRiskCustomers.length}</p>
              <small>High balance, low frequency</small>
            </div>
          </div>

          <div className="segment-card">
            <div className="segment-icon">💰</div>
            <div className="segment-content">
              <h4>Avg Order Value</h4>
              <p className="segment-value">{formatCurrency(summaryStats.avgOrderValue)}</p>
              <small>Across all customers</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {customerLifetimeValue.length > 0 && (
          <>
            <div className="chart-container">
              <h3>🏆 Top Value Customers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerLifetimeValue.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Bar dataKey="clv" fill="#9c27b0" name="Customer Lifetime Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>📊 Customer Retention Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerLifetimeValue.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Retention Rate']} />
                  <Legend />
                  <Bar dataKey="retentionRate" fill="#2196f3" name="Retention Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>🥧 Customer Value Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={valueSegments}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {valueSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'Customers']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {scatterData.length > 0 && (
              <div className="chart-container">
                <h3>📈 CLV vs Retention Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      name="Retention Rate" 
                      unit="%"
                      label={{ value: 'Retention Rate (%)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="y" 
                      name="CLV"
                      label={{ value: 'Customer Lifetime Value (₦)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Retention Rate') return [`${value.toFixed(1)}%`, 'Retention Rate'];
                        if (name === 'CLV') return [formatCurrency(value), 'CLV'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.name;
                        }
                        return label;
                      }}
                    />
                    <Scatter dataKey="y" fill="#4caf50" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Detailed Customer Analysis</h3>
        <DataTable
          data={customerLifetimeValue}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search customers..."
          emptyMessage="No customer data available"
          pageSize={10}
          storageKey="customerAnalysis"
        />
      </div>

      {/* Customer Insights */}
      <div className="customer-insights">
        <h3>💡 Customer Insights</h3>
        <div className="insights-grid">
          {customerLifetimeValue.length > 0 && (
            <>
              <div className="insight-card success">
                <div className="insight-icon">👑</div>
                <div className="insight-content">
                  <h4>Top Customer</h4>
                  <p className="insight-value">{customerLifetimeValue[0].name}</p>
                  <small>CLV: {formatCurrency(customerLifetimeValue[0].clv)}</small>
                </div>
              </div>

              <div className="insight-card info">
                <div className="insight-icon">🤝</div>
                <div className="insight-content">
                  <h4>Most Loyal Customer</h4>
                  {(() => {
                    const mostLoyal = customerLifetimeValue.reduce((max, customer) => 
                      customer.retentionRate > max.retentionRate ? customer : max
                    );
                    return (
                      <>
                        <p className="insight-value">{mostLoyal.name}</p>
                        <small>Retention: {mostLoyal.retentionRate.toFixed(1)}%</small>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="insight-card warning">
                <div className="insight-icon">💰</div>
                <div className="insight-content">
                  <h4>Highest Outstanding</h4>
                  {(() => {
                    const highestOutstanding = customerLifetimeValue.reduce((max, customer) => 
                      customer.outstandingBalance > max.outstandingBalance ? customer : max
                    );
                    return (
                      <>
                        <p className="insight-value">{highestOutstanding.name}</p>
                        <small>Balance: {formatCurrency(highestOutstanding.outstandingBalance)}</small>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <h4>Customer Concentration</h4>
                  <p className="insight-value">
                    {customerLifetimeValue.length > 0 
                      ? ((customerLifetimeValue.slice(0, 5).reduce((sum, c) => sum + c.totalRevenue, 0) / summaryStats.totalRevenue) * 100).toFixed(1)
                      : 0
                    }%
                  </p>
                  <small>Top 5 customers' revenue share</small>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalysis;
