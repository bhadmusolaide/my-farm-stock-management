import { useMemo } from 'react';

/**
 * Custom hook for generating report data with aggregations and grouping
 * @param {Array} data - Raw data array
 * @param {Object} options - Configuration options
 * @returns {Object} - Processed report data
 */
export function useReportData(data = [], options = {}) {
  const {
    groupBy,
    aggregations = {},
    dateField,
    dateRange,
    filters = {}
  } = options;

  return useMemo(() => {
    // Apply filters first
    let filteredData = data.filter(item => {
      // Date range filter
      if (dateRange && dateField) {
        const itemDate = new Date(item[dateField]);
        const startDate = dateRange.start ? new Date(dateRange.start) : new Date(0);
        const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
        
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }

      // Custom filters
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        return item[key] === value;
      });
    });

    // Group data if groupBy is specified
    let groupedData = {};
    if (groupBy) {
      groupedData = filteredData.reduce((groups, item) => {
        const groupKey = typeof groupBy === 'function' 
          ? groupBy(item) 
          : item[groupBy];
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      }, {});
    } else {
      groupedData = { all: filteredData };
    }

    // Apply aggregations
    const aggregatedData = Object.entries(groupedData).map(([groupKey, groupItems]) => {
      const result = { group: groupKey, count: groupItems.length };

      Object.entries(aggregations).forEach(([aggKey, aggConfig]) => {
        const { field, operation } = aggConfig;
        const values = groupItems.map(item => Number(item[field]) || 0);

        switch (operation) {
          case 'sum':
            result[aggKey] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[aggKey] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            result[aggKey] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result[aggKey] = values.length > 0 ? Math.max(...values) : 0;
            break;
          case 'count':
            result[aggKey] = values.filter(val => val > 0).length;
            break;
          default:
            result[aggKey] = 0;
        }
      });

      return result;
    });

    // Calculate totals
    const totals = {
      totalRecords: filteredData.length,
      totalGroups: Object.keys(groupedData).length
    };

    Object.entries(aggregations).forEach(([aggKey, aggConfig]) => {
      const { field, operation } = aggConfig;
      const allValues = filteredData.map(item => Number(item[field]) || 0);

      switch (operation) {
        case 'sum':
          totals[`total_${aggKey}`] = allValues.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          totals[`avg_${aggKey}`] = allValues.length > 0 ? allValues.reduce((sum, val) => sum + val, 0) / allValues.length : 0;
          break;
        case 'min':
          totals[`min_${aggKey}`] = allValues.length > 0 ? Math.min(...allValues) : 0;
          break;
        case 'max':
          totals[`max_${aggKey}`] = allValues.length > 0 ? Math.max(...allValues) : 0;
          break;
      }
    });

    return {
      data: aggregatedData,
      totals,
      filteredCount: filteredData.length,
      originalCount: data.length
    };
  }, [data, groupBy, aggregations, dateField, dateRange, filters]);
}

/**
 * Custom hook for preparing chart data from raw data
 * @param {Array} data - Raw data array
 * @param {Object} options - Chart configuration options
 * @returns {Object} - Chart-ready data
 */
export function useChartData(data = [], options = {}) {
  const {
    chartType = 'line',
    xField,
    yField,
    groupField,
    dateFormat = 'YYYY-MM-DD',
    aggregateBy = 'sum',
    sortBy = 'x',
    sortOrder = 'asc'
  } = options;

  return useMemo(() => {
    if (!xField || !yField) return { data: [], categories: [] };

    // Process data based on chart type
    let processedData = [];
    let categories = [];

    if (chartType === 'pie' || chartType === 'doughnut') {
      // For pie charts, group by xField and sum yField
      const grouped = data.reduce((acc, item) => {
        const key = item[xField];
        const value = Number(item[yField]) || 0;
        
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += value;
        return acc;
      }, {});

      processedData = Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
        percentage: 0 // Will be calculated below
      }));

      // Calculate percentages
      const total = processedData.reduce((sum, item) => sum + item.value, 0);
      processedData = processedData.map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }));

    } else if (chartType === 'bar' || chartType === 'line' || chartType === 'area') {
      if (groupField) {
        // Multi-series chart
        const grouped = data.reduce((acc, item) => {
          const x = item[xField];
          const y = Number(item[yField]) || 0;
          const group = item[groupField];

          if (!acc[x]) {
            acc[x] = {};
          }
          if (!acc[x][group]) {
            acc[x][group] = 0;
          }
          
          if (aggregateBy === 'sum') {
            acc[x][group] += y;
          } else if (aggregateBy === 'avg') {
            acc[x][group] = (acc[x][group] + y) / 2;
          } else if (aggregateBy === 'count') {
            acc[x][group] += 1;
          }

          return acc;
        }, {});

        // Get all unique groups for consistent series
        const allGroups = [...new Set(data.map(item => item[groupField]))];
        categories = allGroups;

        processedData = Object.entries(grouped).map(([x, groups]) => {
          const dataPoint = { x };
          allGroups.forEach(group => {
            dataPoint[group] = groups[group] || 0;
          });
          return dataPoint;
        });

      } else {
        // Single series chart
        const grouped = data.reduce((acc, item) => {
          const x = item[xField];
          const y = Number(item[yField]) || 0;

          if (!acc[x]) {
            acc[x] = [];
          }
          acc[x].push(y);
          return acc;
        }, {});

        processedData = Object.entries(grouped).map(([x, values]) => {
          let y = 0;
          if (aggregateBy === 'sum') {
            y = values.reduce((sum, val) => sum + val, 0);
          } else if (aggregateBy === 'avg') {
            y = values.reduce((sum, val) => sum + val, 0) / values.length;
          } else if (aggregateBy === 'count') {
            y = values.length;
          } else if (aggregateBy === 'min') {
            y = Math.min(...values);
          } else if (aggregateBy === 'max') {
            y = Math.max(...values);
          }

          return { x, y };
        });
      }
    }

    // Sort data
    if (sortBy && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = sortBy === 'x' ? a.x : a.y || a.value;
        let bVal = sortBy === 'x' ? b.x : b.y || b.value;

        // Handle date sorting
        if (xField && xField.toLowerCase().includes('date')) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Generate chart colors
    const colors = generateChartColors(categories.length || processedData.length);

    return {
      data: processedData,
      categories,
      colors,
      isEmpty: processedData.length === 0,
      total: processedData.reduce((sum, item) => sum + (item.y || item.value || 0), 0)
    };
  }, [data, chartType, xField, yField, groupField, aggregateBy, sortBy, sortOrder]);
}

/**
 * Custom hook for trend analysis over time periods
 * @param {Array} data - Time series data
 * @param {Object} options - Analysis options
 * @returns {Object} - Trend analysis results
 */
export function useTrendAnalysis(data = [], options = {}) {
  const {
    dateField,
    valueField,
    period = 'month', // day, week, month, quarter, year
    compareWith = 'previous' // previous, yearAgo
  } = options;

  return useMemo(() => {
    if (!dateField || !valueField || data.length === 0) {
      return { trends: [], summary: {}, comparison: {} };
    }

    // Group data by time period
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const value = Number(item[valueField]) || 0;
      
      let periodKey;
      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!acc[periodKey]) {
        acc[periodKey] = { values: [], sum: 0, count: 0 };
      }
      
      acc[periodKey].values.push(value);
      acc[periodKey].sum += value;
      acc[periodKey].count += 1;

      return acc;
    }, {});

    // Convert to trend data
    const trends = Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        value: data.sum,
        average: data.sum / data.count,
        count: data.count,
        date: new Date(period)
      }))
      .sort((a, b) => a.date - b.date);

    // Calculate trend metrics
    const values = trends.map(t => t.value);
    const totalValue = values.reduce((sum, val) => sum + val, 0);
    const averageValue = totalValue / values.length;
    
    // Calculate growth rates
    const trendsWithGrowth = trends.map((trend, index) => {
      const previousTrend = trends[index - 1];
      const growthRate = previousTrend && previousTrend.value > 0
        ? ((trend.value - previousTrend.value) / previousTrend.value) * 100
        : 0;

      return {
        ...trend,
        growthRate,
        isGrowth: growthRate > 0,
        isDecline: growthRate < 0
      };
    });

    // Overall trend direction
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const overallGrowth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Calculate moving averages
    const movingAverageWindow = Math.min(3, trends.length);
    const trendsWithMA = trendsWithGrowth.map((trend, index) => {
      const start = Math.max(0, index - movingAverageWindow + 1);
      const window = trendsWithGrowth.slice(start, index + 1);
      const movingAverage = window.reduce((sum, t) => sum + t.value, 0) / window.length;

      return {
        ...trend,
        movingAverage
      };
    });

    // Identify peaks and valleys
    const peaks = [];
    const valleys = [];
    
    trendsWithMA.forEach((trend, index) => {
      if (index === 0 || index === trendsWithMA.length - 1) return;
      
      const prev = trendsWithMA[index - 1];
      const next = trendsWithMA[index + 1];
      
      if (trend.value > prev.value && trend.value > next.value) {
        peaks.push(trend);
      } else if (trend.value < prev.value && trend.value < next.value) {
        valleys.push(trend);
      }
    });

    const summary = {
      totalPeriods: trends.length,
      totalValue,
      averageValue,
      overallGrowth,
      trend: overallGrowth > 5 ? 'upward' : overallGrowth < -5 ? 'downward' : 'stable',
      peaks: peaks.length,
      valleys: valleys.length,
      volatility: calculateVolatility(values)
    };

    // Comparison with previous period or year ago
    const comparison = {};
    if (compareWith === 'previous' && trends.length >= 2) {
      const current = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      
      comparison.current = current.value;
      comparison.previous = previous.value;
      comparison.change = current.value - previous.value;
      comparison.changePercent = previous.value > 0 ? ((current.value - previous.value) / previous.value) * 100 : 0;
    }

    return {
      trends: trendsWithMA,
      summary,
      comparison,
      peaks,
      valleys
    };
  }, [data, dateField, valueField, period, compareWith]);
}

/**
 * Custom hook for performance metrics calculation
 * @param {Object} data - Performance data object
 * @param {Object} options - Configuration options
 * @returns {Object} - Performance metrics
 */
export function usePerformanceMetrics(data = {}, options = {}) {
  const {
    targets = {},
    benchmarks = {},
    currency = '₦'
  } = options;

  return useMemo(() => {
    const metrics = {};

    // Financial Performance
    if (data.financial) {
      const { revenue, expenses, profit } = data.financial;
      
      metrics.financial = {
        revenue,
        expenses,
        profit,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
        roi: expenses > 0 ? (profit / expenses) * 100 : 0,
        revenueTarget: targets.revenue || 0,
        revenueAchievement: targets.revenue > 0 ? (revenue / targets.revenue) * 100 : 0
      };
    }

    // Operational Performance
    if (data.operational) {
      const { productivity, efficiency, quality } = data.operational;
      
      metrics.operational = {
        productivity,
        efficiency,
        quality,
        overallScore: (productivity + efficiency + quality) / 3,
        productivityTarget: targets.productivity || 0,
        efficiencyTarget: targets.efficiency || 0,
        qualityTarget: targets.quality || 0
      };
    }

    // Livestock Performance
    if (data.livestock) {
      const { mortalityRate, averageWeight, feedConversion } = data.livestock;
      
      metrics.livestock = {
        mortalityRate,
        averageWeight,
        feedConversion,
        mortalityGrade: mortalityRate < 5 ? 'excellent' : mortalityRate < 10 ? 'good' : 'needs-improvement',
        weightGrade: averageWeight > 2.5 ? 'excellent' : averageWeight > 2.0 ? 'good' : 'needs-improvement',
        fcrGrade: feedConversion < 2.0 ? 'excellent' : feedConversion < 2.5 ? 'good' : 'needs-improvement'
      };
    }

    // Customer Performance
    if (data.customer) {
      const { satisfaction, retention, acquisition } = data.customer;
      
      metrics.customer = {
        satisfaction,
        retention,
        acquisition,
        customerScore: (satisfaction + retention + acquisition) / 3,
        satisfactionGrade: satisfaction > 90 ? 'excellent' : satisfaction > 80 ? 'good' : 'needs-improvement'
      };
    }

    // Calculate overall performance score
    const allScores = Object.values(metrics).map(category => {
      if (category.overallScore) return category.overallScore;
      if (category.customerScore) return category.customerScore;
      if (category.profitMargin) return Math.min(category.profitMargin, 100);
      return 0;
    }).filter(score => score > 0);

    const overallPerformance = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;

    // Performance grade
    const performanceGrade = overallPerformance > 80 ? 'excellent' : 
                           overallPerformance > 60 ? 'good' : 
                           overallPerformance > 40 ? 'fair' : 'poor';

    // Recommendations
    const recommendations = [];
    
    if (metrics.financial && metrics.financial.profitMargin < 20) {
      recommendations.push('Consider reviewing pricing strategy or reducing operational costs');
    }
    
    if (metrics.livestock && metrics.livestock.mortalityRate > 10) {
      recommendations.push('Focus on improving livestock health management');
    }
    
    if (metrics.operational && metrics.operational.efficiency < 70) {
      recommendations.push('Optimize operational processes for better efficiency');
    }

    return {
      metrics,
      overallPerformance,
      performanceGrade,
      recommendations,
      formatted: {
        overallPerformance: `${overallPerformance.toFixed(1)}%`,
        performanceGrade: performanceGrade.toUpperCase()
      }
    };
  }, [data, targets, benchmarks, currency]);
}

// Utility functions
function generateChartColors(count) {
  const baseColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}
