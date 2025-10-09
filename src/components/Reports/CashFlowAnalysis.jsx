import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, ComposedChart
} from 'recharts';
import './Reports.css';

const CashFlowAnalysis = ({ cashFlowData }) => {
  // Table columns configuration
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true
    },
    {
      key: 'income',
      label: 'Income',
      sortable: true,
      render: (row) => (
        <span className="positive">{formatCurrency(row.income)}</span>
      )
    },
    {
      key: 'expenses',
      label: 'Expenses',
      sortable: true,
      render: (row) => (
        <span className="negative">{formatCurrency(row.expenses)}</span>
      )
    },
    {
      key: 'net',
      label: 'Net Cash Flow',
      sortable: true,
      render: (row) => (
        <span className={row.net >= 0 ? 'positive' : 'negative'}>
          {formatCurrency(row.net)}
        </span>
      )
    },
    {
      key: 'runningBalance',
      label: 'Running Balance',
      render: (row, index, data) => {
        // Calculate running balance
        const runningBalance = data.slice(0, index + 1).reduce((sum, item) => sum + item.net, 0);
        return (
          <span className={runningBalance >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(runningBalance)}
          </span>
        );
      }
    }
  ];

  // Calculate summary statistics
  const summaryStats = {
    totalDays: cashFlowData.length,
    totalIncome: cashFlowData.reduce((sum, item) => sum + item.income, 0),
    totalExpenses: cashFlowData.reduce((sum, item) => sum + item.expenses, 0),
    netCashFlow: cashFlowData.reduce((sum, item) => sum + item.net, 0),
    avgDailyIncome: cashFlowData.length > 0 
      ? cashFlowData.reduce((sum, item) => sum + item.income, 0) / cashFlowData.length 
      : 0,
    avgDailyExpenses: cashFlowData.length > 0
      ? cashFlowData.reduce((sum, item) => sum + item.expenses, 0) / cashFlowData.length
      : 0,
    positiveDays: cashFlowData.filter(item => item.net > 0).length,
    negativeDays: cashFlowData.filter(item => item.net < 0).length
  };

  // Calculate running balance for each day
  const cashFlowWithRunningBalance = cashFlowData.map((item, index) => {
    const runningBalance = cashFlowData.slice(0, index + 1).reduce((sum, data) => sum + data.net, 0);
    return { ...item, runningBalance };
  });

  // Find best and worst days
  const bestDay = cashFlowData.reduce((max, item) => 
    item.net > max.net ? item : max, cashFlowData[0] || {});
  
  const worstDay = cashFlowData.reduce((min, item) => 
    item.net < min.net ? item : min, cashFlowData[0] || {});

  // Calculate cash flow trends
  const recentTrend = cashFlowData.length >= 7 
    ? cashFlowData.slice(-7).reduce((sum, item) => sum + item.net, 0)
    : summaryStats.netCashFlow;

  // Prepare data for weekly aggregation
  const weeklyData = [];
  const weeklyMap = {};
  
  cashFlowData.forEach(item => {
    const date = new Date(item.date);
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = {
        week: `Week of ${weekStart.toLocaleDateString()}`,
        income: 0,
        expenses: 0,
        net: 0,
        days: 0
      };
    }
    
    weeklyMap[weekKey].income += item.income;
    weeklyMap[weekKey].expenses += item.expenses;
    weeklyMap[weekKey].net += item.net;
    weeklyMap[weekKey].days += 1;
  });
  
  Object.values(weeklyMap).forEach(week => {
    weeklyData.push(week);
  });
  
  weeklyData.sort((a, b) => new Date(a.week.replace('Week of ', '')) - new Date(b.week.replace('Week of ', '')));

  return (
    <div className="cash-flow-analysis">
      <div className="analysis-header">
        <h2>💰 Cash Flow Analysis</h2>
        <p>Track income, expenses, and net cash flow over time</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>Total Days</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalDays)}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Total Income</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalIncome)}</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">💸</div>
            <div className="stat-content">
              <h4>Total Expenses</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalExpenses)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Net Cash Flow</h4>
              <p className={`stat-value ${summaryStats.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summaryStats.netCashFlow)}
              </p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Daily Income</h4>
              <p className="stat-value">{formatCurrency(summaryStats.avgDailyIncome)}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <h4>Avg Daily Expenses</h4>
              <p className="stat-value">{formatCurrency(summaryStats.avgDailyExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Performance */}
      <div className="cash-flow-performance">
        <h3>📊 Cash Flow Performance</h3>
        <div className="performance-grid">
          <div className="performance-card success">
            <div className="performance-icon">✅</div>
            <div className="performance-content">
              <h4>Positive Days</h4>
              <p className="performance-value">{summaryStats.positiveDays}</p>
              <small>
                {summaryStats.totalDays > 0 
                  ? `${((summaryStats.positiveDays / summaryStats.totalDays) * 100).toFixed(1)}% of days`
                  : '0% of days'
                }
              </small>
            </div>
          </div>

          <div className="performance-card danger">
            <div className="performance-icon">❌</div>
            <div className="performance-content">
              <h4>Negative Days</h4>
              <p className="performance-value">{summaryStats.negativeDays}</p>
              <small>
                {summaryStats.totalDays > 0 
                  ? `${((summaryStats.negativeDays / summaryStats.totalDays) * 100).toFixed(1)}% of days`
                  : '0% of days'
                }
              </small>
            </div>
          </div>

          <div className="performance-card info">
            <div className="performance-icon">📈</div>
            <div className="performance-content">
              <h4>Recent Trend (7 days)</h4>
              <p className={`performance-value ${recentTrend >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(recentTrend)}
              </p>
              <small>Last 7 days net flow</small>
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-icon">🎯</div>
            <div className="performance-content">
              <h4>Cash Flow Ratio</h4>
              <p className="performance-value">
                {summaryStats.totalExpenses > 0 
                  ? (summaryStats.totalIncome / summaryStats.totalExpenses).toFixed(2)
                  : 'N/A'
                }
              </p>
              <small>Income to Expense ratio</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {cashFlowData.length > 0 && (
          <>
            <div className="chart-container">
              <h3>📈 Daily Cash Flow Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke="#4caf50" 
                    fill="#4caf50" 
                    fillOpacity={0.3} 
                    name="Income" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2" 
                    stroke="#f44336" 
                    fill="#f44336" 
                    fillOpacity={0.3} 
                    name="Expenses" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="net" 
                    stackId="3" 
                    stroke="#2196f3" 
                    fill="#2196f3" 
                    fillOpacity={0.3} 
                    name="Net Cash Flow" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>💰 Running Balance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={cashFlowWithRunningBalance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'Running Balance') return [formatCurrency(value), 'Running Balance'];
                    return [formatCurrency(value), name];
                  }} />
                  <Legend />
                  <Bar dataKey="net" fill="#2196f3" name="Daily Net Flow" />
                  <Line 
                    type="monotone" 
                    dataKey="runningBalance" 
                    stroke="#ff9800" 
                    strokeWidth={3}
                    name="Running Balance" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {weeklyData.length > 0 && (
              <div className="chart-container">
                <h3>📊 Weekly Cash Flow Summary</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    <Legend />
                    <Bar dataKey="income" fill="#4caf50" name="Weekly Income" />
                    <Bar dataKey="expenses" fill="#f44336" name="Weekly Expenses" />
                    <Bar dataKey="net" fill="#2196f3" name="Weekly Net" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Daily Cash Flow Details</h3>
        <DataTable
          data={cashFlowData}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search by date..."
          emptyMessage="No cash flow data available"
          pageSize={15}
          storageKey="cashFlowAnalysis"
        />
      </div>

      {/* Cash Flow Insights */}
      <div className="cash-flow-insights">
        <h3>💡 Cash Flow Insights</h3>
        <div className="insights-grid">
          {bestDay && (
            <div className="insight-card success">
              <div className="insight-icon">🏆</div>
              <div className="insight-content">
                <h4>Best Day</h4>
                <p className="insight-value">{bestDay.date}</p>
                <small>Net Flow: {formatCurrency(bestDay.net)}</small>
              </div>
            </div>
          )}

          {worstDay && (
            <div className="insight-card danger">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h4>Worst Day</h4>
                <p className="insight-value">{worstDay.date}</p>
                <small>Net Flow: {formatCurrency(worstDay.net)}</small>
              </div>
            </div>
          )}

          <div className="insight-card info">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Cash Flow Stability</h4>
              <p className="insight-value">
                {summaryStats.positiveDays > summaryStats.negativeDays ? 'Stable' : 'Volatile'}
              </p>
              <small>
                {summaryStats.positiveDays > summaryStats.negativeDays 
                  ? 'More positive than negative days'
                  : 'More negative than positive days'
                }
              </small>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Break-even Rate</h4>
              <p className="insight-value">
                {summaryStats.totalDays > 0 
                  ? `${((summaryStats.positiveDays / summaryStats.totalDays) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
              <small>Days with positive cash flow</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowAnalysis;
