import React, { useMemo } from 'react';
import { DataTable } from '../UI';
import { formatNumber, formatDate } from '../../utils/formatters';
import './LiveChicken.css';

const AnalyticsView = ({ batches = [], transactions = [] }) => {
  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!batches || batches.length === 0) {
      return {
        performanceMetrics: {},
        breedAnalysis: [],
        ageDistribution: [],
        mortalityTrends: [],
        productionEfficiency: {}
      };
    }

    // Helper function to calculate age
    const calculateAge = (hatchDate) => {
      if (!hatchDate) return 0;
      const today = new Date();
      const hatch = new Date(hatchDate);
      const diffTime = Math.abs(today - hatch);
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks;
    };

    // Process batches with calculated fields
    const processedBatches = batches.map(batch => ({
      ...batch,
      age: calculateAge(batch.hatch_date),
      mortalityRate: batch.initial_count > 0 
        ? (((batch.initial_count - batch.current_count) / batch.initial_count) * 100).toFixed(1)
        : 0,
      weightGain: (batch.current_weight || 0) - (batch.expected_weight || 0),
      efficiency: batch.current_weight > 0 && batch.age > 0 
        ? (batch.current_weight / batch.age).toFixed(2)
        : 0
    }));

    // Performance metrics
    const totalBirds = processedBatches.reduce((sum, batch) => sum + (batch.current_count || 0), 0);
    const totalInitialBirds = processedBatches.reduce((sum, batch) => sum + (batch.initial_count || 0), 0);
    const overallMortalityRate = totalInitialBirds > 0 
      ? (((totalInitialBirds - totalBirds) / totalInitialBirds) * 100).toFixed(1)
      : 0;
    const averageWeight = processedBatches.length > 0
      ? (processedBatches.reduce((sum, batch) => sum + (batch.current_weight || 0), 0) / processedBatches.length).toFixed(2)
      : 0;
    const averageAge = processedBatches.length > 0
      ? Math.round(processedBatches.reduce((sum, batch) => sum + batch.age, 0) / processedBatches.length)
      : 0;

    const performanceMetrics = {
      totalBatches: processedBatches.length,
      totalBirds,
      overallMortalityRate,
      averageWeight,
      averageAge,
      productionEfficiency: averageWeight > 0 && averageAge > 0 
        ? (averageWeight / averageAge).toFixed(2)
        : 0
    };

    // Breed analysis
    const breedGroups = processedBatches.reduce((acc, batch) => {
      const breed = batch.breed || 'Unknown';
      if (!acc[breed]) {
        acc[breed] = {
          breed,
          batchCount: 0,
          totalBirds: 0,
          totalInitialBirds: 0,
          averageWeight: 0,
          averageMortalityRate: 0
        };
      }
      acc[breed].batchCount += 1;
      acc[breed].totalBirds += batch.current_count || 0;
      acc[breed].totalInitialBirds += batch.initial_count || 0;
      acc[breed].averageWeight += batch.current_weight || 0;
      acc[breed].averageMortalityRate += parseFloat(batch.mortalityRate);
      return acc;
    }, {});

    const breedAnalysis = Object.values(breedGroups).map(group => ({
      ...group,
      averageWeight: (group.averageWeight / group.batchCount).toFixed(2),
      averageMortalityRate: (group.averageMortalityRate / group.batchCount).toFixed(1),
      mortalityRate: group.totalInitialBirds > 0 
        ? (((group.totalInitialBirds - group.totalBirds) / group.totalInitialBirds) * 100).toFixed(1)
        : 0
    }));

    // Age distribution
    const ageGroups = processedBatches.reduce((acc, batch) => {
      const ageGroup = batch.age <= 2 ? '0-2 weeks' :
                      batch.age <= 4 ? '3-4 weeks' :
                      batch.age <= 6 ? '5-6 weeks' :
                      batch.age <= 8 ? '7-8 weeks' : '9+ weeks';
      
      if (!acc[ageGroup]) {
        acc[ageGroup] = {
          ageGroup,
          batchCount: 0,
          totalBirds: 0,
          averageWeight: 0,
          averageMortalityRate: 0
        };
      }
      acc[ageGroup].batchCount += 1;
      acc[ageGroup].totalBirds += batch.current_count || 0;
      acc[ageGroup].averageWeight += batch.current_weight || 0;
      acc[ageGroup].averageMortalityRate += parseFloat(batch.mortalityRate);
      return acc;
    }, {});

    const ageDistribution = Object.values(ageGroups).map(group => ({
      ...group,
      averageWeight: (group.averageWeight / group.batchCount).toFixed(2),
      averageMortalityRate: (group.averageMortalityRate / group.batchCount).toFixed(1)
    }));

    // Mortality trends (simplified - would need historical data for real trends)
    const mortalityTrends = processedBatches
      .filter(batch => parseFloat(batch.mortalityRate) > 0)
      .sort((a, b) => new Date(b.hatch_date) - new Date(a.hatch_date))
      .slice(0, 10)
      .map(batch => ({
        batchId: batch.batch_id,
        breed: batch.breed,
        hatchDate: batch.hatch_date,
        mortalityRate: batch.mortalityRate,
        age: batch.age,
        status: batch.status
      }));

    return {
      performanceMetrics,
      breedAnalysis,
      ageDistribution,
      mortalityTrends,
      productionEfficiency: performanceMetrics
    };
  }, [batches, transactions]);

  // Table columns for breed analysis
  const breedColumns = [
    { key: 'breed', label: 'Breed' },
    { key: 'batchCount', label: 'Batches' },
    { key: 'totalBirds', label: 'Total Birds' },
    { key: 'averageWeight', label: 'Avg Weight (kg)' },
    { key: 'mortalityRate', label: 'Mortality Rate (%)' }
  ];

  // Table columns for age distribution
  const ageColumns = [
    { key: 'ageGroup', label: 'Age Group' },
    { key: 'batchCount', label: 'Batches' },
    { key: 'totalBirds', label: 'Total Birds' },
    { key: 'averageWeight', label: 'Avg Weight (kg)' },
    { key: 'averageMortalityRate', label: 'Avg Mortality (%)' }
  ];

  // Table columns for mortality trends
  const mortalityColumns = [
    { key: 'batchId', label: 'Batch ID' },
    { key: 'breed', label: 'Breed' },
    { key: 'hatchDate', label: 'Hatch Date' },
    { key: 'age', label: 'Age (weeks)' },
    { key: 'mortalityRate', label: 'Mortality Rate (%)' },
    { key: 'status', label: 'Status' }
  ];

  // Custom cell renderers
  const renderBreedCell = (value, row, column) => {
    if (column.key === 'totalBirds') {
      return formatNumber(value);
    }
    if (column.key === 'mortalityRate') {
      return (
        <span className={parseFloat(value) > 10 ? 'high-mortality' : ''}>
          {value}%
        </span>
      );
    }
    return value;
  };

  const renderAgeCell = (value, row, column) => {
    if (column.key === 'totalBirds') {
      return formatNumber(value);
    }
    if (column.key === 'averageMortalityRate') {
      return (
        <span className={parseFloat(value) > 10 ? 'high-mortality' : ''}>
          {value}%
        </span>
      );
    }
    return value;
  };

  const renderMortalityCell = (value, row, column) => {
    if (column.key === 'hatchDate') {
      return formatDate(value);
    }
    if (column.key === 'mortalityRate') {
      return (
        <span className={parseFloat(value) > 15 ? 'critical-mortality' : 'high-mortality'}>
          {value}%
        </span>
      );
    }
    if (column.key === 'age') {
      return `${value} weeks`;
    }
    return value;
  };

  return (
    <div className="analytics-view">
      <h2>Analytics Dashboard</h2>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <h3>📊 Performance Overview</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Batches</h4>
            <p className="metric-value">{analyticsData.performanceMetrics.totalBatches}</p>
          </div>
          <div className="metric-card">
            <h4>Total Birds</h4>
            <p className="metric-value">{formatNumber(analyticsData.performanceMetrics.totalBirds)}</p>
          </div>
          <div className="metric-card">
            <h4>Overall Mortality Rate</h4>
            <p className={`metric-value ${parseFloat(analyticsData.performanceMetrics.overallMortalityRate) > 10 ? 'warning' : 'success'}`}>
              {analyticsData.performanceMetrics.overallMortalityRate}%
            </p>
          </div>
          <div className="metric-card">
            <h4>Average Weight</h4>
            <p className="metric-value">{analyticsData.performanceMetrics.averageWeight} kg</p>
          </div>
          <div className="metric-card">
            <h4>Average Age</h4>
            <p className="metric-value">{analyticsData.performanceMetrics.averageAge} weeks</p>
          </div>
          <div className="metric-card">
            <h4>Production Efficiency</h4>
            <p className="metric-value">{analyticsData.performanceMetrics.productionEfficiency} kg/week</p>
          </div>
        </div>
      </div>

      {/* Breed Analysis */}
      <div className="breed-analysis">
        <h3>🐔 Breed Performance Analysis</h3>
        <DataTable
          data={analyticsData.breedAnalysis}
          columns={breedColumns}
          renderCell={renderBreedCell}
          enableSorting
          enablePagination={false}
          emptyMessage="No breed data available"
        />
      </div>

      {/* Age Distribution */}
      <div className="age-distribution">
        <h3>📅 Age Distribution Analysis</h3>
        <DataTable
          data={analyticsData.ageDistribution}
          columns={ageColumns}
          renderCell={renderAgeCell}
          enableSorting
          enablePagination={false}
          emptyMessage="No age distribution data available"
        />
      </div>

      {/* Mortality Trends */}
      {analyticsData.mortalityTrends.length > 0 && (
        <div className="mortality-trends">
          <h3>⚠️ Recent Mortality Trends</h3>
          <DataTable
            data={analyticsData.mortalityTrends}
            columns={mortalityColumns}
            renderCell={renderMortalityCell}
            enableSorting
            enablePagination={false}
            emptyMessage="No mortality data available"
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
