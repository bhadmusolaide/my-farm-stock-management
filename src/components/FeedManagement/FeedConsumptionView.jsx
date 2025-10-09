import React, { useMemo } from 'react';
import { DataTable, FilterPanel } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './FeedManagement.css';

const FeedConsumptionView = ({
  feedConsumption = [],
  feedInventory = [],
  liveChickens = [],
  onDelete,
  filters,
  onFiltersChange,
  loading = false
}) => {
  // Filter configuration
  const filterConfig = [
    {
      key: 'feed_type',
      type: 'select',
      label: 'Feed Type',
      options: [
        { value: '', label: 'All Feed Types' },
        ...Array.from(new Set(feedInventory.map(item => item.feed_type)))
          .map(type => ({ value: type, label: type }))
      ]
    },
    {
      key: 'chicken_batch_id',
      type: 'select',
      label: 'Chicken Batch',
      options: [
        { value: '', label: 'All Batches' },
        ...liveChickens.map(batch => ({
          value: batch.id,
          label: `${batch.batch_id} - ${batch.breed}`
        }))
      ]
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: 'Consumption Date Range',
      startKey: 'startDate',
      endKey: 'endDate'
    }
  ];

  // Apply filters to consumption data
  const filteredConsumption = useMemo(() => {
    return feedConsumption.filter(item => {
      // Get feed details
      const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
      
      // Feed type filter
      if (filters.feed_type && feedItem?.feed_type !== filters.feed_type) {
        return false;
      }

      // Chicken batch filter
      if (filters.chicken_batch_id && item.chicken_batch_id !== filters.chicken_batch_id) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const consumptionDate = new Date(item.consumption_date);
        if (filters.startDate && consumptionDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate && consumptionDate > new Date(filters.endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [feedConsumption, feedInventory, filters]);

  // Table columns configuration
  const columns = [
    {
      key: 'consumption_date',
      label: 'Date',
      sortable: true,
      render: (item) => formatDate(item.consumption_date)
    },
    {
      key: 'feed_info',
      label: 'Feed Details',
      render: (item) => {
        const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
        return (
          <div className="feed-details">
            <div className="feed-type">{feedItem?.feed_type || 'Unknown'}</div>
            <div className="feed-brand">{feedItem?.brand || 'Unknown Brand'}</div>
          </div>
        );
      }
    },
    {
      key: 'chicken_batch',
      label: 'Chicken Batch',
      render: (item) => {
        const batch = liveChickens.find(b => b.id === item.chicken_batch_id);
        return (
          <div className="batch-details">
            <div className="batch-id">{batch?.batch_id || 'Unknown Batch'}</div>
            <div className="batch-breed">{batch?.breed || ''}</div>
          </div>
        );
      }
    },
    {
      key: 'quantity_consumed',
      label: 'Quantity Consumed',
      sortable: true,
      render: (item) => (
        <div className="quantity-consumed">
          <strong>{formatNumber(item.quantity_consumed, 2)} kg</strong>
        </div>
      )
    },
    {
      key: 'cost_per_kg',
      label: 'Cost Analysis',
      render: (item) => {
        const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
        if (!feedItem) return 'N/A';
        
        const costPerKg = feedItem.cost_per_bag / (feedItem.quantity_kg / feedItem.number_of_bags);
        const totalCost = costPerKg * item.quantity_consumed;
        
        return (
          <div className="cost-analysis">
            <div className="cost-per-kg">₦{formatNumber(costPerKg, 2)}/kg</div>
            <div className="total-cost">Total: ₦{formatNumber(totalCost, 2)}</div>
          </div>
        );
      }
    },
    {
      key: 'fcr',
      label: 'FCR Analysis',
      render: (item) => {
        const batch = liveChickens.find(b => b.id === item.chicken_batch_id);
        if (!batch) return 'N/A';
        
        // Calculate FCR (Feed Conversion Ratio)
        const birdCount = batch.current_count || 0;
        const fcrPerBird = birdCount > 0 ? item.quantity_consumed / birdCount : 0;
        
        return (
          <div className="fcr-analysis">
            <div className="fcr-per-bird">{formatNumber(fcrPerBird, 3)} kg/bird</div>
            <div className="bird-count">{birdCount} birds</div>
          </div>
        );
      }
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (item) => item.notes || 'No notes'
    }
  ];

  // Row actions
  const renderActions = (item) => (
    <div className="action-buttons">
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(item.id)}
        title="Delete Consumption Record"
      >
        🗑️
      </button>
    </div>
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalRecords: filteredConsumption.length,
      totalQuantity: 0,
      totalCost: 0,
      avgDailyConsumption: 0,
      avgFCR: 0
    };

    let totalCost = 0;
    let totalFCR = 0;
    let fcrCount = 0;

    filteredConsumption.forEach(item => {
      stats.totalQuantity += item.quantity_consumed;
      
      // Calculate cost
      const feedItem = feedInventory.find(feed => feed.id === item.feed_id);
      if (feedItem) {
        const costPerKg = feedItem.cost_per_bag / (feedItem.quantity_kg / feedItem.number_of_bags);
        totalCost += costPerKg * item.quantity_consumed;
      }
      
      // Calculate FCR
      const batch = liveChickens.find(b => b.id === item.chicken_batch_id);
      if (batch && batch.current_count > 0) {
        const fcr = item.quantity_consumed / batch.current_count;
        totalFCR += fcr;
        fcrCount++;
      }
    });

    stats.totalCost = totalCost;
    stats.avgFCR = fcrCount > 0 ? totalFCR / fcrCount : 0;

    // Calculate average daily consumption
    const uniqueDates = new Set(filteredConsumption.map(item => item.consumption_date));
    stats.avgDailyConsumption = uniqueDates.size > 0 ? stats.totalQuantity / uniqueDates.size : 0;

    return stats;
  }, [filteredConsumption, feedInventory, liveChickens]);

  // Daily consumption trend
  const dailyConsumption = useMemo(() => {
    const dailyData = new Map();
    
    filteredConsumption.forEach(item => {
      const date = item.consumption_date;
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          totalQuantity: 0,
          recordCount: 0
        });
      }
      
      const dayData = dailyData.get(date);
      dayData.totalQuantity += item.quantity_consumed;
      dayData.recordCount++;
    });
    
    return Array.from(dailyData.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7); // Last 7 days
  }, [filteredConsumption]);

  return (
    <div className="feed-consumption-view">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <h4>Total Records</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalRecords)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⚖️</div>
          <div className="summary-content">
            <h4>Total Consumed</h4>
            <p className="summary-value">{formatNumber(summaryStats.totalQuantity, 2)} kg</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h4>Total Cost</h4>
            <p className="summary-value">₦{formatNumber(summaryStats.totalCost, 2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h4>Avg Daily Consumption</h4>
            <p className="summary-value">{formatNumber(summaryStats.avgDailyConsumption, 2)} kg/day</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-content">
            <h4>Avg FCR</h4>
            <p className="summary-value">{formatNumber(summaryStats.avgFCR, 3)} kg/bird</p>
          </div>
        </div>
      </div>

      {/* Daily Consumption Trend */}
      {dailyConsumption.length > 0 && (
        <div className="daily-consumption-trend">
          <h4>📊 Recent Daily Consumption</h4>
          <div className="trend-cards">
            {dailyConsumption.map(day => (
              <div key={day.date} className="trend-card">
                <div className="trend-date">{formatDate(day.date)}</div>
                <div className="trend-quantity">{formatNumber(day.totalQuantity, 2)} kg</div>
                <div className="trend-records">{day.recordCount} records</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterConfig={filterConfig}
        collapsible
        title="Filter Feed Consumption"
      />

      {/* Data Table */}
      <DataTable
        data={filteredConsumption}
        columns={columns}
        loading={loading}
        enableSorting
        enablePagination
        enableSearch
        searchPlaceholder="Search consumption records..."
        renderActions={renderActions}
        emptyMessage="No consumption records found"
        storageKey="feedConsumption"
      />
    </div>
  );
};

export default FeedConsumptionView;
