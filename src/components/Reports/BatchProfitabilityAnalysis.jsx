import React from 'react';
import { DataTable } from '../UI';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import './Reports.css';

const BatchProfitabilityAnalysis = ({ batchProfitability }) => {
  // Table columns configuration
  const columns = [
    {
      key: 'batchId',
      label: 'Batch ID',
      sortable: true
    },
    {
      key: 'breed',
      label: 'Breed',
      sortable: true
    },
    {
      key: 'initialCount',
      label: 'Initial Count',
      sortable: true,
      render: (row) => formatNumber(row.initialCount)
    },
    {
      key: 'currentCount',
      label: 'Current Count',
      sortable: true,
      render: (row) => formatNumber(row.currentCount)
    },
    {
      key: 'mortalityRate',
      label: 'Mortality Rate',
      sortable: true,
      render: (row) => `${row.mortalityRate.toFixed(1)}%`
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (row) => formatCurrency(row.revenue)
    },
    {
      key: 'cost',
      label: 'Total Cost',
      sortable: true,
      render: (row) => formatCurrency(row.cost)
    },
    {
      key: 'feedCost',
      label: 'Feed Cost',
      sortable: true,
      render: (row) => formatCurrency(row.feedCost)
    },
    {
      key: 'profit',
      label: 'Profit',
      sortable: true,
      render: (row) => (
        <span className={row.profit >= 0 ? 'positive' : 'negative'}>
          {formatCurrency(row.profit)}
        </span>
      )
    },
    {
      key: 'profitMargin',
      label: 'Profit Margin',
      sortable: true,
      render: (row) => (
        <span className={row.profitMargin >= 0 ? 'positive' : 'negative'}>
          {row.profitMargin.toFixed(1)}%
        </span>
      )
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
    totalBatches: batchProfitability.length,
    profitableBatches: batchProfitability.filter(batch => batch.profit > 0).length,
    totalRevenue: batchProfitability.reduce((sum, batch) => sum + batch.revenue, 0),
    totalProfit: batchProfitability.reduce((sum, batch) => sum + batch.profit, 0),
    avgProfitMargin: batchProfitability.length > 0 
      ? batchProfitability.reduce((sum, batch) => sum + batch.profitMargin, 0) / batchProfitability.length 
      : 0,
    avgMortalityRate: batchProfitability.length > 0
      ? batchProfitability.reduce((sum, batch) => sum + batch.mortalityRate, 0) / batchProfitability.length
      : 0
  };

  // Prepare radar chart data
  const radarData = batchProfitability.slice(0, 5).map(batch => ({
    batchId: batch.batchId,
    revenue: batch.revenue / 1000, // Scale for radar chart
    profit: Math.max(0, batch.profit / 1000), // Ensure non-negative for radar
    efficiency: batch.currentCount / batch.initialCount * 100,
    profitMargin: Math.max(0, batch.profitMargin) // Ensure non-negative
  }));

  return (
    <div className="batch-profitability-analysis">
      <div className="analysis-header">
        <h2>🎯 Batch Profitability Analysis</h2>
        <p>Compare profitability across different chicken batches</p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Batches</h4>
              <p className="stat-value">{formatNumber(summaryStats.totalBatches)}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Profitable Batches</h4>
              <p className="stat-value">
                {formatNumber(summaryStats.profitableBatches)} 
                <small>({summaryStats.totalBatches > 0 ? ((summaryStats.profitableBatches / summaryStats.totalBatches) * 100).toFixed(1) : 0}%)</small>
              </p>
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Total Revenue</h4>
              <p className="stat-value">{formatCurrency(summaryStats.totalRevenue)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Total Profit</h4>
              <p className={`stat-value ${summaryStats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summaryStats.totalProfit)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Avg Profit Margin</h4>
              <p className="stat-value">{summaryStats.avgProfitMargin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h4>Avg Mortality Rate</h4>
              <p className="stat-value">{summaryStats.avgMortalityRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-section">
        <h3>📋 Detailed Batch Analysis</h3>
        <DataTable
          data={batchProfitability}
          columns={columns}
          enableSorting
          enablePagination
          enableSearch
          searchPlaceholder="Search batches..."
          emptyMessage="No batch data available"
          pageSize={10}
          storageKey="batchProfitability"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {batchProfitability.length > 0 && (
          <div className="chart-container">
            <h3>📊 Top Performing Batches</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batchProfitability.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batchId" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                <Legend />
                <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                <Bar dataKey="profit" fill="#2196f3" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {radarData.length > 0 && (
          <div className="chart-container">
            <h3>🎯 Batch Performance Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="batchId" />
                <PolarRadiusAxis />
                <Radar 
                  name="Revenue (x1000)" 
                  dataKey="revenue" 
                  stroke="#4caf50" 
                  fill="#4caf50" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Profit (x1000)" 
                  dataKey="profit" 
                  stroke="#2196f3" 
                  fill="#2196f3" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Efficiency %" 
                  dataKey="efficiency" 
                  stroke="#ff9800" 
                  fill="#ff9800" 
                  fillOpacity={0.3} 
                />
                <Legend />
                <Tooltip formatter={(value, name) => {
                  if (name.includes('Revenue') || name.includes('Profit')) {
                    return [formatCurrency(value * 1000), name];
                  }
                  return [`${value.toFixed(1)}%`, name];
                }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <h3>💡 Performance Insights</h3>
        <div className="insights-grid">
          {batchProfitability.length > 0 && (
            <>
              <div className="insight-card success">
                <div className="insight-icon">🏆</div>
                <div className="insight-content">
                  <h4>Best Performing Batch</h4>
                  <p className="insight-value">{batchProfitability[0].batchId}</p>
                  <small>Profit: {formatCurrency(batchProfitability[0].profit)}</small>
                </div>
              </div>

              <div className="insight-card info">
                <div className="insight-icon">📈</div>
                <div className="insight-content">
                  <h4>Highest Revenue Batch</h4>
                  {(() => {
                    const highestRevenue = batchProfitability.reduce((max, batch) => 
                      batch.revenue > max.revenue ? batch : max
                    );
                    return (
                      <>
                        <p className="insight-value">{highestRevenue.batchId}</p>
                        <small>Revenue: {formatCurrency(highestRevenue.revenue)}</small>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="insight-card warning">
                <div className="insight-icon">⚠️</div>
                <div className="insight-content">
                  <h4>Highest Mortality Rate</h4>
                  {(() => {
                    const highestMortality = batchProfitability.reduce((max, batch) => 
                      batch.mortalityRate > max.mortalityRate ? batch : max
                    );
                    return (
                      <>
                        <p className="insight-value">{highestMortality.batchId}</p>
                        <small>Mortality: {highestMortality.mortalityRate.toFixed(1)}%</small>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">💰</div>
                <div className="insight-content">
                  <h4>Most Cost Efficient</h4>
                  {(() => {
                    const mostEfficient = batchProfitability.reduce((max, batch) => 
                      batch.revenue > 0 && (batch.cost / batch.revenue) < (max.cost / max.revenue || Infinity) ? batch : max
                    );
                    return (
                      <>
                        <p className="insight-value">{mostEfficient.batchId}</p>
                        <small>Cost Ratio: {mostEfficient.revenue > 0 ? ((mostEfficient.cost / mostEfficient.revenue) * 100).toFixed(1) : 0}%</small>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchProfitabilityAnalysis;
