import React, { useMemo } from 'react';
import { DataTable } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './FeedManagement.css';

const FeedAnalyticsView = ({
  feedInventory = [],
  feedConsumption = [],
  liveChickens = []
}) => {
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

    // Per-batch analysis
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
      const fcr = batch.current_count > 0 ? consumed / batch.current_count : 0;

      batchStats[batch.id] = {
        batch,
        assigned,
        consumed,
        remaining,
        fcr
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
      label: 'FCR (kg/bird)',
      sortable: true,
      render: (row) => formatNumber(row.fcr, 3)
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
    </div>
  );
};

export default FeedAnalyticsView;
