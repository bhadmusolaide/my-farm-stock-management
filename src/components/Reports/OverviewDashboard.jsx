import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  useFinancialCalculations,
  useLivestockMetrics,
  useChartData,
  usePerformanceMetrics
} from '../../hooks';
import { useAppContext } from '../../context';
import { MetricCard, PerformanceTable } from '../UI';
import './Reports.css';

const OverviewDashboard = ({
  dateRange,
  keyMetrics,
  revenueChartData,
  expensesChartData,
  liveChickensData
}) => {
  const { transactions, chickens, liveChickens, weightHistory } = useAppContext();


  // Use custom hooks for calculations
  const financialMetrics = useFinancialCalculations(transactions, chickens, {
    currency: '₦',
    dateRange
  });

  const livestockMetrics = useLivestockMetrics(liveChickens, weightHistory);

  const performanceMetrics = usePerformanceMetrics({
    financial: {
      revenue: financialMetrics.orderRevenue,
      expenses: financialMetrics.totalExpenses,
      profit: financialMetrics.grossProfit
    },
    livestock: {
      mortalityRate: livestockMetrics.mortalityRate,
      averageWeight: livestockMetrics.averageWeight,
      feedConversion: livestockMetrics.averageFCR
    }
  });

  // Prepare chart data using custom hooks
  const revenueChartDataLocal = useChartData(financialMetrics.monthlyBreakdown, {
    chartType: 'bar',
    xField: 'month',
    yField: 'income',
    sortBy: 'x',
    sortOrder: 'asc'
  });

  const expensesChartDataLocal = useChartData(financialMetrics.monthlyBreakdown, {
    chartType: 'bar',
    xField: 'month',
    yField: 'expenses',
    sortBy: 'x',
    sortOrder: 'asc'
  });

  const liveChickensChartDataLocal = useChartData(livestockMetrics.batchMetrics, {
    chartType: 'pie',
    xField: 'breed',
    yField: 'current_count'
  });

  const COLORS = revenueChartDataLocal.colors;

  // Use keyMetrics from props if available, otherwise construct from calculations
  const finalKeyMetrics = keyMetrics || {
    financial: {
      revenue: financialMetrics.orderRevenue || 0,
      expenses: financialMetrics.totalExpenses || 0,
      profit: financialMetrics.grossProfit || 0,
      profitMargin: financialMetrics.profitMargin || 0
    },
    funds: {
      added: financialMetrics.fundsAdded || 0,
      withdrawn: financialMetrics.fundsWithdrawn || 0,
      balance: financialMetrics.currentBalance || 0
    },
    stock: {
      items: financialMetrics.totalStockItems || 0,
      value: financialMetrics.totalStockValue || 0
    },
    feed: {
      stock: financialMetrics.feedStock || 0
    },
    customers: {
      total: financialMetrics.totalCustomers || 0,
      outstandingBalance: financialMetrics.outstandingBalance || 0,
      pending: financialMetrics.pendingOrders || 0,
      partial: financialMetrics.partiallyPaidOrders || 0
    },
    liveChickens: {
      total: livestockMetrics.totalChickens || 0,
      mortality: livestockMetrics.totalMortality || 0,
      mortalityRate: livestockMetrics.mortalityRate || 0
    }
  };


  // Prepare performance data for PerformanceTable
  const financialPerformanceData = [
    {
      metric: 'Revenue',
      value: financialMetrics.formatted.orderRevenue,
      change: 0 // You can calculate change from previous period if available
    },
    {
      metric: 'Expenses',
      value: financialMetrics.formatted.totalExpenses,
      change: 0
    },
    {
      metric: 'Net Profit',
      value: financialMetrics.formatted.grossProfit,
      change: financialMetrics.grossProfit >= 0 ? 5 : -5 // Example change
    },
    {
      metric: 'Profit Margin',
      value: financialMetrics.formatted.profitMargin,
      change: 0
    },
    {
      metric: 'ROI',
      value: financialMetrics.formatted.roi,
      change: 0
    }
  ];

  return (
    <div className="overview-dashboard">
        {/* Key Metrics Overview */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">📊</span>
              Financial Performance Overview
            </h2>
            <div className="section-actions">
              <span className={`badge ${performanceMetrics.performanceGrade}`}>
                {performanceMetrics.formatted.performanceGrade}
              </span>
            </div>
          </div>

          <PerformanceTable
            title="Financial Metrics"
            data={financialPerformanceData}
          />
        </section>

        <div className="metrics-grid">
          {/* Funds Metrics */}
          <div className="metric-card funds">
            <div className="metric-header">
              <h3>💳 Funds Management</h3>
            </div>
            <div className="metric-content">
              <div className="metric-item">
                <span className="metric-label">Funds Added</span>
                <span className="metric-value positive">+{formatCurrency(finalKeyMetrics.funds.added)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Funds Withdrawn</span>
                <span className="metric-value negative">-{formatCurrency(finalKeyMetrics.funds.withdrawn)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Current Balance</span>
                <span className="metric-value">{formatCurrency(finalKeyMetrics.funds.balance)}</span>
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
                <span className="metric-value">{formatNumber(finalKeyMetrics.stock.items)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Stock Value</span>
                <span className="metric-value">{formatCurrency(finalKeyMetrics.stock.value)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Feed Stock</span>
                <span className="metric-value">{formatNumber(finalKeyMetrics.feed.stock, 1)} kg</span>
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
                <span className="metric-value">{formatNumber(finalKeyMetrics.customers.total)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Outstanding Balance</span>
                <span className="metric-value">{formatCurrency(finalKeyMetrics.customers.outstandingBalance)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Pending Orders</span>
                <span className="metric-value">{formatNumber(finalKeyMetrics.customers.pending)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Partially Paid</span>
                <span className="metric-value">{formatNumber(finalKeyMetrics.customers.partial)}</span>
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
                <span className="metric-value">{formatNumber(finalKeyMetrics.liveChickens.total)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mortality</span>
                <span className="metric-value">{formatNumber(finalKeyMetrics.liveChickens.mortality)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mortality Rate</span>
                <span className="metric-value">{finalKeyMetrics.liveChickens.mortalityRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>📈 Revenue Trend</h3>
          {!revenueChartDataLocal.isEmpty ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartDataLocal.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Bar dataKey="y" fill="#4caf50" name="Revenue" />
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
          {!expensesChartDataLocal.isEmpty ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesChartDataLocal.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Expenses']} />
                <Legend />
                <Bar dataKey="y" fill="#f44336" name="Expenses" />
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
          {!liveChickensChartDataLocal.isEmpty ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={liveChickensChartDataLocal.data}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                >
                  {liveChickensChartDataLocal.data.map((entry, index) => (
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
              <strong>Performance:</strong> {finalKeyMetrics.financial.profit >= 0 ? 'Profitable' : 'Loss-making'} with a {finalKeyMetrics.financial.profitMargin.toFixed(1)}% margin
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">💰</span>
            <div className="summary-text">
              <strong>Liquidity:</strong> Current balance of {formatCurrency(finalKeyMetrics.funds.balance)} ({finalKeyMetrics.funds.added > finalKeyMetrics.funds.withdrawn ? 'positive' : 'negative'} cash flow)
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">📦</span>
            <div className="summary-text">
              <strong>Inventory:</strong> {formatNumber(finalKeyMetrics.stock.items)} stock items valued at {formatCurrency(finalKeyMetrics.stock.value)}
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">👥</span>
            <div className="summary-text">
              <strong>Customers:</strong> {formatNumber(finalKeyMetrics.customers.total)} customers with {formatCurrency(finalKeyMetrics.customers.outstandingBalance)} outstanding balance
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">🐔</span>
            <div className="summary-text">
              <strong>Livestock:</strong> {formatNumber(finalKeyMetrics.liveChickens.total)} chickens with {finalKeyMetrics.liveChickens.mortalityRate.toFixed(1)}% mortality rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
