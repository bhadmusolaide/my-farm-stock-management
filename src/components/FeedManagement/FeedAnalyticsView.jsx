import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context';
import { DataTable } from '../UI';
import { BatchFeedSummary } from './';
import { formatNumber, formatDate } from '../../utils/formatters';
import './FeedManagement.css';

const FeedAnalyticsView = ({
  feedInventory = [],
  feedConsumption = [],
  liveChickens = []
}) => {
  const { calculateBatchFCR, weightHistory = [] } = useAppContext();
  const [showSummary, setShowSummary] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const handleViewSummary = (batchId) => {
    setSelectedBatchId(batchId);
    setShowSummary(true);
  };
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // Overall statistics
    const totalFeedCost = feedInventory.reduce((sum, item) => 
      sum + ((item.number_of_bags || 1) * item.cost_per_bag), 0
    );

    const totalFeedStock = feedInventory.reduce((sum, item) => sum + item.quantity_kg, 0);
    const totalConsumed = feedConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0);

    // Calculate average daily consumption
    const uniqueDates = new Set(feedConsumption.map(item => item.consumption_date));
    const avgDailyConsumption = uniqueDates.size > 0 ? totalConsumed / uniqueDates.size : 0;

    // Calculate feed efficiency (total weight gained / total feed consumed)
    const totalWeight = liveChickens.reduce((sum, batch) => sum + (batch.currentWeight || 0), 0);
    const feedEfficiency = totalConsumed > 0 ? (totalWeight / totalConsumed) * 100 : 0;

    // Active batches
    const activeBatches = liveChickens.filter(batch => 
      batch.status === 'healthy' || batch.status === 'sick'
    ).length;

    // Per-batch analysis with proper FCR calculation
    const batchStats = {};
    liveChickens.filter(batch => batch.status === 'healthy' || batch.status === 'sick').forEach(batch => {
      // Calculate assigned feed for this batch
      const assigned = feedInventory.reduce((sum, item) => {
        const batchAssignment = item.assigned_batches?.find(ab => ab.batch_id === batch.id);
        return sum + (batchAssignment?.assigned_quantity_kg || 0);
      }, 0);

      // Calculate consumed feed for this batch
      const consumed = feedConsumption
        .filter(consumption => consumption.chicken_batch_id === batch.id)
        .reduce((sum, consumption) => sum + consumption.quantity_consumed, 0);

      const remaining = assigned - consumed;

      // Use proper FCR calculation from context
      let fcrData = null;
      if (calculateBatchFCR) {
        fcrData = calculateBatchFCR(batch.id, liveChickens, weightHistory);
      }

      batchStats[batch.id] = {
        batch,
        assigned,
        consumed,
        remaining,
        fcr: fcrData?.fcr || 0,
        fcrRating: fcrData?.rating || 'N/A',
        fcrColor: fcrData?.color || '#999',
        totalWeightGain: fcrData?.totalWeightGain || 0,
        avgFeedPerBird: consumed / (batch.current_count || 1)
      };
    });

    // Feed type analysis
    const feedTypeStats = {};
    const feedTypes = [...new Set(feedInventory.map(item => item.feed_type))];
    
    feedTypes.forEach(feedType => {
      const typeInventory = feedInventory.filter(item => item.feed_type === feedType);
      const typeConsumption = feedConsumption.filter(item => {
        const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
        return feedItem?.feed_type === feedType;
      });

      const totalStock = typeInventory.reduce((sum, item) => sum + item.quantity_kg, 0);
      const totalConsumed = typeConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0);
      const remaining = totalStock - totalConsumed;
      const totalCost = typeInventory.reduce((sum, item) => 
        sum + ((item.number_of_bags || 1) * item.cost_per_bag), 0
      );
      const usageRate = totalStock > 0 ? (totalConsumed / totalStock) * 100 : 0;

      feedTypeStats[feedType] = {
        feedType,
        totalStock,
        totalConsumed,
        remaining,
        totalCost,
        usageRate
      };
    });

    // Brand analysis
    const brandStats = {};
    const brands = [...new Set(feedInventory.map(item => item.brand))];
    
    brands.forEach(brand => {
      const brandInventory = feedInventory.filter(item => item.brand === brand);
      const brandConsumption = feedConsumption.filter(item => {
        const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
        return feedItem?.brand === brand;
      });

      const totalStock = brandInventory.reduce((sum, item) => sum + item.quantity_kg, 0);
      const totalConsumed = brandConsumption.reduce((sum, item) => sum + item.quantity_consumed, 0);
      const totalCost = brandInventory.reduce((sum, item) => 
        sum + ((item.number_of_bags || 1) * item.cost_per_bag), 0
      );

      brandStats[brand] = {
        brand,
        totalStock,
        totalConsumed,
        totalCost,
        avgCostPerKg: totalStock > 0 ? totalCost / totalStock : 0
      };
    });

    return {
      overview: {
        totalFeedCost,
        totalFeedStock,
        totalConsumed,
        avgDailyConsumption,
        feedEfficiency,
        activeBatches
      },
      batchStats: Object.values(batchStats),
      feedTypeStats: Object.values(feedTypeStats),
      brandStats: Object.values(brandStats)
    };
  }, [feedInventory, feedConsumption, liveChickens]);

  // Batch analysis table columns
  const batchColumns = [
    {
      key: 'batch_id',
      label: 'Batch ID',
      sortable: true,
      render: (row) => row.batch.batch_id
    },
    {
      key: 'breed',
      label: 'Breed',
      render: (row) => row.batch.breed
    },
    {
      key: 'bird_count',
      label: 'Birds',
      sortable: true,
      render: (row) => formatNumber(row.batch.current_count)
    },
    {
      key: 'assigned',
      label: 'Assigned (kg)',
      sortable: true,
      render: (row) => formatNumber(row.assigned, 2)
    },
    {
      key: 'consumed',
      label: 'Consumed (kg)',
      sortable: true,
      render: (row) => formatNumber(row.consumed, 2)
    },
    {
      key: 'remaining',
      label: 'Remaining (kg)',
      sortable: true,
      render: (row) => (
        <span className={row.remaining < 0 ? 'negative-remaining' : ''}>
          {formatNumber(row.remaining, 2)}
        </span>
      )
    },
    {
      key: 'fcr',
      label: 'FCR',
      sortable: true,
      render: (row) => {
        if (!row.fcr || row.fcr === 0) {
          return <span className="fcr-badge na">N/A</span>;
        }

        return (
          <div className="fcr-display">
            <span
              className="fcr-badge"
              style={{
                backgroundColor: row.fcrColor,
                color: 'white'
              }}
            >
              {formatNumber(row.fcr, 2)}
            </span>
            <small className="fcr-rating">{row.fcrRating}</small>
          </div>
        );
      }
    },
    {
      key: 'weight_gain',
      label: 'Weight Gain (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalWeightGain, 2)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleViewSummary(row.batch.id)}
        >
          📋 View Summary
        </button>
      )
    }
  ];

  // Feed type analysis table columns
  const feedTypeColumns = [
    {
      key: 'feedType',
      label: 'Feed Type',
      sortable: true
    },
    {
      key: 'totalStock',
      label: 'Total Stock (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalStock, 2)
    },
    {
      key: 'totalConsumed',
      label: 'Consumed (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalConsumed, 2)
    },
    {
      key: 'remaining',
      label: 'Remaining (kg)',
      sortable: true,
      render: (row) => formatNumber(row.remaining, 2)
    },
    {
      key: 'totalCost',
      label: 'Total Cost (₦)',
      sortable: true,
      render: (row) => formatNumber(row.totalCost, 2)
    },
    {
      key: 'usageRate',
      label: 'Usage Rate',
      sortable: true,
      render: (row) => `${formatNumber(row.usageRate, 1)}%`
    }
  ];

  // Brand analysis table columns
  const brandColumns = [
    {
      key: 'brand',
      label: 'Brand',
      sortable: true
    },
    {
      key: 'totalStock',
      label: 'Total Stock (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalStock, 2)
    },
    {
      key: 'totalConsumed',
      label: 'Consumed (kg)',
      sortable: true,
      render: (row) => formatNumber(row.totalConsumed, 2)
    },
    {
      key: 'totalCost',
      label: 'Total Cost (₦)',
      sortable: true,
      render: (row) => formatNumber(row.totalCost, 2)
    },
    {
      key: 'avgCostPerKg',
      label: 'Avg Cost/kg (₦)',
      sortable: true,
      render: (row) => formatNumber(row.avgCostPerKg, 2)
    }
  ];

  return (
    <div className="feed-analytics-view">
      {/* Overview Statistics */}
      <div className="analytics-overview">
        <h3>📊 Feed Management Overview</h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Total Feed Cost</h4>
              <p className="stat-value">₦{formatNumber(analytics.overview.totalFeedCost, 2)}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h4>Total Feed Stock</h4>
              <p className="stat-value">{formatNumber(analytics.overview.totalFeedStock, 2)} kg</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🍽️</div>
            <div className="stat-content">
              <h4>Total Consumed</h4>
              <p className="stat-value">{formatNumber(analytics.overview.totalConsumed, 2)} kg</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4>Avg Daily Consumption</h4>
              <p className="stat-value">{formatNumber(analytics.overview.avgDailyConsumption, 1)} kg/day</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Feed Efficiency</h4>
              <p className="stat-value">{formatNumber(analytics.overview.feedEfficiency, 1)}%</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🐔</div>
            <div className="stat-content">
              <h4>Active Batches</h4>
              <p className="stat-value">{formatNumber(analytics.overview.activeBatches)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FCR Analysis Section */}
      <div className="fcr-analysis-section">
        <h3>📊 Feed Conversion Ratio (FCR) Analysis</h3>
        <div className="fcr-info-box">
          <p>
            <strong>FCR</strong> measures feed efficiency: <em>Total Feed Consumed (kg) ÷ Total Weight Gain (kg)</em>
          </p>
          <div className="fcr-legend">
            <span className="fcr-legend-item excellent">
              <span className="fcr-dot" style={{ backgroundColor: '#28a745' }}></span>
              Excellent (&lt; 1.5)
            </span>
            <span className="fcr-legend-item good">
              <span className="fcr-dot" style={{ backgroundColor: '#17a2b8' }}></span>
              Good (1.5 - 1.8)
            </span>
            <span className="fcr-legend-item average">
              <span className="fcr-dot" style={{ backgroundColor: '#ffc107' }}></span>
              Average (1.8 - 2.2)
            </span>
            <span className="fcr-legend-item poor">
              <span className="fcr-dot" style={{ backgroundColor: '#dc3545' }}></span>
              Poor (≥ 2.2)
            </span>
          </div>
        </div>

        {/* FCR Cards */}
        <div className="fcr-cards-grid">
          {analytics.batchStats.map(stat => (
            <div key={stat.batch.id} className="fcr-card">
              <div className="fcr-card-header">
                <h4>{stat.batch.batch_id}</h4>
                <span className="fcr-breed">{stat.batch.breed}</span>
              </div>
              <div className="fcr-card-body">
                <div
                  className="fcr-value-large"
                  style={{ color: stat.fcrColor }}
                >
                  {stat.fcr > 0 ? formatNumber(stat.fcr, 2) : 'N/A'}
                </div>
                <div className="fcr-rating-badge" style={{ backgroundColor: stat.fcrColor }}>
                  {stat.fcrRating}
                </div>
              </div>
              <div className="fcr-card-stats">
                <div className="fcr-stat">
                  <span className="fcr-stat-label">Feed Consumed</span>
                  <span className="fcr-stat-value">{formatNumber(stat.consumed, 2)} kg</span>
                </div>
                <div className="fcr-stat">
                  <span className="fcr-stat-label">Weight Gain</span>
                  <span className="fcr-stat-value">{formatNumber(stat.totalWeightGain, 2)} kg</span>
                </div>
                <div className="fcr-stat">
                  <span className="fcr-stat-label">Birds</span>
                  <span className="fcr-stat-value">{formatNumber(stat.batch.current_count)}</span>
                </div>
                <div className="fcr-stat">
                  <span className="fcr-stat-label">Avg Feed/Bird</span>
                  <span className="fcr-stat-value">{formatNumber(stat.avgFeedPerBird, 2)} kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Batch Analysis */}
      <div className="batch-analysis">
        <h3>🐔 Per-Batch Feed Analysis</h3>
        <DataTable
          data={analytics.batchStats}
          columns={batchColumns}
          enableSorting
          enablePagination
          emptyMessage="No active batches found"
          pageSize={10}
        />
      </div>

      {/* Feed Type Analysis */}
      <div className="feed-type-analysis">
        <h3>🌾 Feed Type Analysis</h3>
        <DataTable
          data={analytics.feedTypeStats}
          columns={feedTypeColumns}
          enableSorting
          enablePagination
          emptyMessage="No feed types found"
          pageSize={10}
        />
      </div>

      {/* Brand Analysis */}
      <div className="brand-analysis">
        <h3>🏷️ Brand Performance Analysis</h3>
        <DataTable
          data={analytics.brandStats}
          columns={brandColumns}
          enableSorting
          enablePagination
          emptyMessage="No brands found"
          pageSize={10}
        />
      </div>

      {/* Feed Efficiency Insights */}
      <div className="efficiency-insights">
        <h3>💡 Feed Efficiency Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Best Performing Batch</h4>
              {analytics.batchStats.length > 0 && (() => {
                const bestBatch = analytics.batchStats.reduce((best, current) => 
                  current.fcr > 0 && (best.fcr === 0 || current.fcr < best.fcr) ? current : best
                );
                return (
                  <div>
                    <p className="insight-value">{bestBatch.batch.batch_id}</p>
                    <small>FCR: {formatNumber(bestBatch.fcr, 3)} kg/bird</small>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-content">
              <h4>Most Cost-Effective Brand</h4>
              {analytics.brandStats.length > 0 && (() => {
                const cheapestBrand = analytics.brandStats.reduce((cheapest, current) => 
                  current.avgCostPerKg > 0 && (cheapest.avgCostPerKg === 0 || current.avgCostPerKg < cheapest.avgCostPerKg) ? current : cheapest
                );
                return (
                  <div>
                    <p className="insight-value">{cheapestBrand.brand}</p>
                    <small>₦{formatNumber(cheapestBrand.avgCostPerKg, 2)}/kg</small>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Most Used Feed Type</h4>
              {analytics.feedTypeStats.length > 0 && (() => {
                const mostUsed = analytics.feedTypeStats.reduce((most, current) => 
                  current.totalConsumed > most.totalConsumed ? current : most
                );
                return (
                  <div>
                    <p className="insight-value">{mostUsed.feedType}</p>
                    <small>{formatNumber(mostUsed.totalConsumed, 2)} kg consumed</small>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Batches Needing Feed</h4>
              {(() => {
                const needingFeed = analytics.batchStats.filter(batch => batch.remaining <= 0).length;
                return (
                  <div>
                    <p className="insight-value">{needingFeed}</p>
                    <small>batches with low/no feed</small>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Feed Summary Modal */}
      <BatchFeedSummary
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        batchId={selectedBatchId}
      />
    </div>
  );
};

export default FeedAnalyticsView;
