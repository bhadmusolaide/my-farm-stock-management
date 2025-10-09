import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './Reports.css';

const OverviewDashboard = ({
  keyMetrics,
  revenueChartData,
  expensesChartData,
  liveChickensData
}) => {
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

  return (
    <div className="overview-dashboard">
      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metrics-grid">
          {/* Financial Metrics */}
          <div className="metric-card financial">
            <div className="metric-header">
              <h3>💰 Financial Overview</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Revenue</span>
                <span className="metric-value">{formatCurrency(keyMetrics.financial.revenue)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Expenses</span>
                <span className="metric-value">{formatCurrency(keyMetrics.financial.expenses)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Net Profit</span>
                <span className={`metric-value ${keyMetrics.financial.profit >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(keyMetrics.financial.profit)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Profit Margin</span>
                <span className="metric-value">
                  {keyMetrics.financial.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Funds Metrics */}
          <div className="metric-card funds">
            <div className="metric-header">
              <h3>💳 Funds Management</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Funds Added</span>
                <span className="metric-value positive">+{formatCurrency(keyMetrics.funds.added)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Funds Withdrawn</span>
                <span className="metric-value negative">-{formatCurrency(keyMetrics.funds.withdrawn)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Current Balance</span>
                <span className="metric-value">{formatCurrency(keyMetrics.funds.balance)}</span>
              </div>
            </div>
          </div>

          {/* Stock Metrics */}
          <div className="metric-card stock">
            <div className="metric-header">
              <h3>📦 General Stock</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Items in Stock</span>
                <span className="metric-value">{formatNumber(keyMetrics.stock.items)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Stock Value</span>
                <span className="metric-value">{formatCurrency(keyMetrics.stock.value)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Feed Stock</span>
                <span className="metric-value">{formatNumber(keyMetrics.feed.stock, 1)} kg</span>
              </div>
            </div>
          </div>

          {/* Customer Metrics */}
          <div className="metric-card customers">
            <div className="metric-header">
              <h3>👥 Customer Overview</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Total Customers</span>
                <span className="metric-value">{formatNumber(keyMetrics.customers.total)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Outstanding Balance</span>
                <span className="metric-value">{formatCurrency(keyMetrics.customers.outstandingBalance)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Pending Orders</span>
                <span className="metric-value">{formatNumber(keyMetrics.customers.pending)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Partially Paid</span>
                <span className="metric-value">{formatNumber(keyMetrics.customers.partial)}</span>
              </div>
            </div>
          </div>

          {/* Live Chicken Metrics */}
          <div className="metric-card livestock">
            <div className="metric-header">
              <h3>🐔 Live Chicken Stock</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Total Chickens</span>
                <span className="metric-value">{formatNumber(keyMetrics.liveChickens.total)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mortality</span>
                <span className="metric-value">{formatNumber(keyMetrics.liveChickens.mortality)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mortality Rate</span>
                <span className="metric-value">{keyMetrics.liveChickens.mortalityRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>📈 Revenue Trend</h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>📊 No revenue data available for the selected period</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>📉 Expenses Trend</h3>
          {expensesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Expenses']} />
                <Legend />
                <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>📊 No expense data available for the selected period</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>🐔 Live Chicken Stock Distribution</h3>
          {liveChickensData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={liveChickensData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {liveChickensData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), 'Chickens']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>🐔 No live chicken data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="quick-summary">
        <h2>📋 Quick Summary</h2>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-icon">💹</span>
            <div className="summary-text">
              <strong>Performance:</strong> {keyMetrics.financial.profit >= 0 ? 'Profitable' : 'Loss-making'} with a {keyMetrics.financial.profitMargin.toFixed(1)}% margin
            </div>
          </div>
          
          <div className="summary-item">
            <span className="summary-icon">💰</span>
            <div className="summary-text">
              <strong>Liquidity:</strong> Current balance of {formatCurrency(keyMetrics.funds.balance)} ({keyMetrics.funds.added > keyMetrics.funds.withdrawn ? 'positive' : 'negative'} cash flow)
            </div>
          </div>
          
          <div className="summary-item">
            <span className="summary-icon">📦</span>
            <div className="summary-text">
              <strong>Inventory:</strong> {formatNumber(keyMetrics.stock.items)} stock items valued at {formatCurrency(keyMetrics.stock.value)}
            </div>
          </div>
          
          <div className="summary-item">
            <span className="summary-icon">👥</span>
            <div className="summary-text">
              <strong>Customers:</strong> {formatNumber(keyMetrics.customers.total)} customers with {formatCurrency(keyMetrics.customers.outstandingBalance)} outstanding balance
            </div>
          </div>
          
          <div className="summary-item">
            <span className="summary-icon">🐔</span>
            <div className="summary-text">
              <strong>Livestock:</strong> {formatNumber(keyMetrics.liveChickens.total)} chickens with {keyMetrics.liveChickens.mortalityRate.toFixed(1)}% mortality rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
