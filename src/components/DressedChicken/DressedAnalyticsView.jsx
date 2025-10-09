import React, { useMemo } from 'react';
import { DataTable } from '../UI';
import { formatNumber, formatWeight, formatDate } from '../../utils/formatters';
import './DressedChicken.css';

const DressedAnalyticsView = ({ 
  dressedChickens = [], 
  chickenSizeCategories = [] 
}) => {
  // Helper functions
  const getWholeChickenCount = (chicken) => {
    return chicken.current_count || chicken.initial_count || 0;
  };

  const getSizeCategoryDisplay = (chicken) => {
    if (chicken.size_category_custom) {
      return chicken.size_category_custom;
    }
    
    if (chicken.size_category_id) {
      const category = chickenSizeCategories.find(sc => sc.id === chicken.size_category_id);
      return category ? category.name : 'Unknown';
    }
    
    return chicken.size_category || 'Medium';
  };

  const isExpired = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    return expiryDate < today;
  };

  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!dressedChickens || dressedChickens.length === 0) {
      return {
        overallStats: {},
        sizeDistribution: [],
        storageAnalysis: [],
        expiryAnalysis: {},
        partsAnalysis: {},
        monthlyTrends: []
      };
    }

    // Overall statistics
    const totalBatches = dressedChickens.length;
    const totalWholeChickens = dressedChickens.reduce((sum, dc) => sum + getWholeChickenCount(dc), 0);
    const totalWeight = dressedChickens.reduce((sum, dc) => sum + (getWholeChickenCount(dc) * (dc.average_weight || 0)), 0);
    const averageWeight = totalWholeChickens > 0 ? totalWeight / totalWholeChickens : 0;

    // Size distribution analysis
    const sizeGroups = dressedChickens.reduce((acc, dc) => {
      const sizeKey = getSizeCategoryDisplay(dc);
      if (!acc[sizeKey]) {
        acc[sizeKey] = {
          sizeCategory: sizeKey,
          batchCount: 0,
          totalChickens: 0,
          totalWeight: 0,
          averageWeight: 0
        };
      }
      const chickens = getWholeChickenCount(dc);
      acc[sizeKey].batchCount += 1;
      acc[sizeKey].totalChickens += chickens;
      acc[sizeKey].totalWeight += chickens * (dc.average_weight || 0);
      return acc;
    }, {});

    const sizeDistribution = Object.values(sizeGroups).map(group => ({
      ...group,
      averageWeight: group.totalChickens > 0 ? (group.totalWeight / group.totalChickens).toFixed(2) : 0,
      percentage: ((group.totalChickens / totalWholeChickens) * 100).toFixed(1)
    }));

    // Storage location analysis
    const storageGroups = dressedChickens.reduce((acc, dc) => {
      const location = dc.storage_location || 'Unspecified';
      if (!acc[location]) {
        acc[location] = {
          storageLocation: location,
          batchCount: 0,
          totalChickens: 0,
          totalWeight: 0
        };
      }
      const chickens = getWholeChickenCount(dc);
      acc[location].batchCount += 1;
      acc[location].totalChickens += chickens;
      acc[location].totalWeight += chickens * (dc.average_weight || 0);
      return acc;
    }, {});

    const storageAnalysis = Object.values(storageGroups);

    // Expiry analysis
    const expired = dressedChickens.filter(dc => isExpired(dc.expiry_date));
    const expiringSoon = dressedChickens.filter(dc => isExpiringSoon(dc.expiry_date));
    const fresh = dressedChickens.filter(dc => !isExpired(dc.expiry_date) && !isExpiringSoon(dc.expiry_date));

    const expiryAnalysis = {
      expired: {
        count: expired.length,
        chickens: expired.reduce((sum, dc) => sum + getWholeChickenCount(dc), 0)
      },
      expiringSoon: {
        count: expiringSoon.length,
        chickens: expiringSoon.reduce((sum, dc) => sum + getWholeChickenCount(dc), 0)
      },
      fresh: {
        count: fresh.length,
        chickens: fresh.reduce((sum, dc) => sum + getWholeChickenCount(dc), 0)
      }
    };

    // Parts analysis
    const partsData = dressedChickens.reduce((acc, dc) => {
      if (dc.parts_count) {
        acc.neck += dc.parts_count.neck || 0;
        acc.feet += dc.parts_count.feet || 0;
        acc.gizzard += dc.parts_count.gizzard || 0;
        acc.dog_food += dc.parts_count.dog_food || 0;
      }
      if (dc.parts_weight) {
        acc.neckWeight += dc.parts_weight.neck || 0;
        acc.feetWeight += dc.parts_weight.feet || 0;
        acc.gizzardWeight += dc.parts_weight.gizzard || 0;
        acc.dogFoodWeight += dc.parts_weight.dog_food || 0;
      }
      return acc;
    }, {
      neck: 0, feet: 0, gizzard: 0, dog_food: 0,
      neckWeight: 0, feetWeight: 0, gizzardWeight: 0, dogFoodWeight: 0
    });

    // Monthly trends (simplified - would need more historical data for real trends)
    const monthlyGroups = dressedChickens.reduce((acc, dc) => {
      if (!dc.processing_date) return acc;
      
      const date = new Date(dc.processing_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          batchCount: 0,
          totalChickens: 0,
          totalWeight: 0
        };
      }
      
      const chickens = getWholeChickenCount(dc);
      acc[monthKey].batchCount += 1;
      acc[monthKey].totalChickens += chickens;
      acc[monthKey].totalWeight += chickens * (dc.average_weight || 0);
      return acc;
    }, {});

    const monthlyTrends = Object.values(monthlyGroups)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return {
      overallStats: {
        totalBatches,
        totalWholeChickens,
        totalWeight: totalWeight.toFixed(2),
        averageWeight: averageWeight.toFixed(2)
      },
      sizeDistribution,
      storageAnalysis,
      expiryAnalysis,
      partsAnalysis: partsData,
      monthlyTrends
    };
  }, [dressedChickens, chickenSizeCategories]);

  // Table columns for size distribution
  const sizeColumns = [
    { key: 'sizeCategory', label: 'Size Category' },
    { key: 'batchCount', label: 'Batches' },
    { key: 'totalChickens', label: 'Total Chickens' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'averageWeight', label: 'Avg Weight (kg)' }
  ];

  // Table columns for storage analysis
  const storageColumns = [
    { key: 'storageLocation', label: 'Storage Location' },
    { key: 'batchCount', label: 'Batches' },
    { key: 'totalChickens', label: 'Total Chickens' },
    { key: 'totalWeight', label: 'Total Weight (kg)' }
  ];

  // Table columns for monthly trends
  const trendsColumns = [
    { key: 'month', label: 'Month' },
    { key: 'batchCount', label: 'Batches Processed' },
    { key: 'totalChickens', label: 'Chickens Processed' },
    { key: 'totalWeight', label: 'Total Weight (kg)' }
  ];

  // Custom cell renderers
  const renderSizeCell = (value, row, column) => {
    if (column.key === 'totalChickens') {
      return formatNumber(value);
    }
    if (column.key === 'percentage') {
      return `${value}%`;
    }
    return value;
  };

  const renderStorageCell = (value, row, column) => {
    if (column.key === 'totalChickens') {
      return formatNumber(value);
    }
    if (column.key === 'totalWeight') {
      return value.toFixed(2);
    }
    return value;
  };

  const renderTrendsCell = (value, row, column) => {
    if (column.key === 'month') {
      const [year, month] = value.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    if (column.key === 'totalChickens') {
      return formatNumber(value);
    }
    if (column.key === 'totalWeight') {
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <div className="dressed-analytics-view">
      <h2>Dressed Chicken Analytics</h2>

      {/* Overall Statistics */}
      <div className="analytics-overview">
        <h3>📊 Overall Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h4>Total Batches</h4>
              <p className="stat-value">{analyticsData.overallStats.totalBatches}</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">🐔</div>
            <div className="stat-content">
              <h4>Total Chickens</h4>
              <p className="stat-value">{formatNumber(analyticsData.overallStats.totalWholeChickens)}</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <h4>Total Weight</h4>
              <p className="stat-value">{analyticsData.overallStats.totalWeight} kg</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <h4>Average Weight</h4>
              <p className="stat-value">{analyticsData.overallStats.averageWeight} kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Status Overview */}
      <div className="expiry-overview">
        <h3>⏰ Expiry Status Overview</h3>
        <div className="expiry-cards">
          <div className="expiry-card fresh">
            <h4>Fresh</h4>
            <p>{analyticsData.expiryAnalysis.fresh?.count || 0} batches</p>
            <p>{formatNumber(analyticsData.expiryAnalysis.fresh?.chickens || 0)} chickens</p>
          </div>
          <div className="expiry-card expiring">
            <h4>Expiring Soon</h4>
            <p>{analyticsData.expiryAnalysis.expiringSoon?.count || 0} batches</p>
            <p>{formatNumber(analyticsData.expiryAnalysis.expiringSoon?.chickens || 0)} chickens</p>
          </div>
          <div className="expiry-card expired">
            <h4>Expired</h4>
            <p>{analyticsData.expiryAnalysis.expired?.count || 0} batches</p>
            <p>{formatNumber(analyticsData.expiryAnalysis.expired?.chickens || 0)} chickens</p>
          </div>
        </div>
      </div>

      {/* Size Distribution Analysis */}
      <div className="size-distribution">
        <h3>📏 Size Distribution Analysis</h3>
        <DataTable
          data={analyticsData.sizeDistribution}
          columns={sizeColumns}
          renderCell={renderSizeCell}
          enableSorting
          enablePagination={false}
          emptyMessage="No size distribution data available"
        />
      </div>

      {/* Storage Location Analysis */}
      <div className="storage-analysis">
        <h3>🏪 Storage Location Analysis</h3>
        <DataTable
          data={analyticsData.storageAnalysis}
          columns={storageColumns}
          renderCell={renderStorageCell}
          enableSorting
          enablePagination={false}
          emptyMessage="No storage analysis data available"
        />
      </div>

      {/* Parts Inventory Summary */}
      <div className="parts-summary">
        <h3>🍗 Parts Inventory Summary</h3>
        <div className="parts-grid">
          <div className="part-card">
            <h4>Neck</h4>
            <p>{formatNumber(analyticsData.partsAnalysis.neck)} pieces</p>
            <p>{analyticsData.partsAnalysis.neckWeight.toFixed(2)} kg</p>
          </div>
          <div className="part-card">
            <h4>Feet</h4>
            <p>{formatNumber(analyticsData.partsAnalysis.feet)} pieces</p>
            <p>{analyticsData.partsAnalysis.feetWeight.toFixed(2)} kg</p>
          </div>
          <div className="part-card">
            <h4>Gizzard</h4>
            <p>{formatNumber(analyticsData.partsAnalysis.gizzard)} pieces</p>
            <p>{analyticsData.partsAnalysis.gizzardWeight.toFixed(2)} kg</p>
          </div>
          <div className="part-card">
            <h4>Dog Food</h4>
            <p>{formatNumber(analyticsData.partsAnalysis.dog_food)} pieces</p>
            <p>{analyticsData.partsAnalysis.dogFoodWeight.toFixed(2)} kg</p>
          </div>
        </div>
      </div>

      {/* Monthly Processing Trends */}
      {analyticsData.monthlyTrends.length > 0 && (
        <div className="monthly-trends">
          <h3>📈 Monthly Processing Trends</h3>
          <DataTable
            data={analyticsData.monthlyTrends}
            columns={trendsColumns}
            renderCell={renderTrendsCell}
            enableSorting
            enablePagination={false}
            emptyMessage="No monthly trends data available"
          />
        </div>
      )}
    </div>
  );
};

export default DressedAnalyticsView;
