import { useMemo } from 'react';

/**
 * Custom hook for financial calculations
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} orders - Array of order objects
 * @param {Object} options - Configuration options
 * @returns {Object} - Financial metrics and calculations
 */
export function useFinancialCalculations(transactions = [], orders = [], options = {}) {
  const { currency = '₦', dateRange } = options;

  return useMemo(() => {
    // Filter data by date range if provided
    const filteredTransactions = dateRange 
      ? transactions.filter(t => {
          const date = new Date(t.date);
          return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
        })
      : transactions;

    const filteredOrders = dateRange
      ? orders.filter(o => {
          const date = new Date(o.date);
          return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
        })
      : orders;

    // Basic financial metrics
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'fund' || t.type === 'sale')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalWithdrawals = filteredTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netIncome = totalIncome - totalExpenses - totalWithdrawals;

    // Order-based revenue calculations
    const orderRevenue = filteredOrders.reduce((sum, order) => {
      return sum + ((order.count || 0) * (order.size || 0) * (order.price || 0));
    }, 0);

    const totalBalance = filteredOrders.reduce((sum, order) => sum + (order.balance || 0), 0);
    const totalPaid = orderRevenue - totalBalance;

    // Profitability metrics
    const grossProfit = orderRevenue - totalExpenses;
    const profitMargin = orderRevenue > 0 ? (grossProfit / orderRevenue) * 100 : 0;
    const roi = totalExpenses > 0 ? (grossProfit / totalExpenses) * 100 : 0;

    // Cash flow analysis
    const cashFlow = {
      inflow: totalIncome + totalPaid,
      outflow: totalExpenses + totalWithdrawals,
      net: (totalIncome + totalPaid) - (totalExpenses + totalWithdrawals)
    };

    // Monthly breakdown
    const monthlyData = {};
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, withdrawals: 0 };
      }
      
      if (transaction.type === 'fund' || transaction.type === 'sale') {
        monthlyData[monthKey].income += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'stock_expense') {
        monthlyData[monthKey].expenses += transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        monthlyData[monthKey].withdrawals += transaction.amount;
      }
    });

    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      net: data.income - data.expenses - data.withdrawals
    }));

    // Financial ratios
    const ratios = {
      expenseRatio: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses - totalWithdrawals) / totalIncome) * 100 : 0,
      burnRate: totalExpenses / (filteredTransactions.length > 0 ? Math.max(1, filteredTransactions.length / 30) : 1) // Daily burn rate
    };

    return {
      // Basic metrics
      totalIncome,
      totalExpenses,
      totalWithdrawals,
      netIncome,
      orderRevenue,
      totalBalance,
      totalPaid,
      
      // Profitability
      grossProfit,
      profitMargin,
      roi,
      
      // Cash flow
      cashFlow,
      
      // Breakdowns
      monthlyBreakdown,
      
      // Ratios
      ratios,
      
      // Formatted values
      formatted: {
        totalIncome: `${currency}${totalIncome.toLocaleString()}`,
        totalExpenses: `${currency}${totalExpenses.toLocaleString()}`,
        netIncome: `${currency}${netIncome.toLocaleString()}`,
        orderRevenue: `${currency}${orderRevenue.toLocaleString()}`,
        grossProfit: `${currency}${grossProfit.toLocaleString()}`,
        profitMargin: `${profitMargin.toFixed(1)}%`,
        roi: `${roi.toFixed(1)}%`
      }
    };
  }, [transactions, orders, currency, dateRange]);
}

/**
 * Custom hook for livestock metrics and calculations
 * @param {Array} liveChickens - Array of live chicken batch objects
 * @param {Array} weightHistory - Array of weight history records
 * @param {Object} options - Configuration options
 * @returns {Object} - Livestock metrics and calculations
 */
export function useLivestockMetrics(liveChickens = [], weightHistory = [], options = {}) {
  const { targetWeight = 2.5, targetAge = 42 } = options;

  return useMemo(() => {
    // Basic livestock counts
    const totalBatches = liveChickens.length;
    const totalLiveChickens = liveChickens.reduce((sum, batch) => sum + (batch.current_count || 0), 0);
    const totalInitialChickens = liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0);
    const totalMortality = totalInitialChickens - totalLiveChickens;
    const mortalityRate = totalInitialChickens > 0 ? (totalMortality / totalInitialChickens) * 100 : 0;

    // Age and weight analysis
    const batchMetrics = liveChickens.map(batch => {
      const hatchDate = new Date(batch.hatch_date);
      const currentDate = new Date();
      const ageInDays = Math.floor((currentDate - hatchDate) / (1000 * 60 * 60 * 24));
      
      // Get latest weight for this batch
      const batchWeights = weightHistory.filter(w => w.batch_id === batch.id);
      const latestWeight = batchWeights.length > 0 
        ? batchWeights.sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))[0]
        : null;

      const currentWeight = latestWeight ? latestWeight.average_weight : 0;
      const weightGain = latestWeight && batch.initial_weight 
        ? currentWeight - batch.initial_weight 
        : 0;
      
      const dailyWeightGain = ageInDays > 0 ? weightGain / ageInDays : 0;
      const projectedWeight = batch.initial_weight + (dailyWeightGain * targetAge);
      
      const feedConversionRatio = batch.total_feed_consumed && weightGain > 0
        ? batch.total_feed_consumed / (weightGain * batch.current_count)
        : 0;

      return {
        ...batch,
        ageInDays,
        currentWeight,
        weightGain,
        dailyWeightGain,
        projectedWeight,
        feedConversionRatio,
        isReadyForProcessing: ageInDays >= targetAge && currentWeight >= targetWeight,
        mortalityRate: batch.initial_count > 0 
          ? ((batch.initial_count - batch.current_count) / batch.initial_count) * 100 
          : 0
      };
    });

    // Performance metrics
    const averageAge = batchMetrics.length > 0
      ? batchMetrics.reduce((sum, batch) => sum + batch.ageInDays, 0) / batchMetrics.length
      : 0;

    const averageWeight = batchMetrics.length > 0
      ? batchMetrics.reduce((sum, batch) => sum + batch.currentWeight, 0) / batchMetrics.length
      : 0;

    const averageDailyGain = batchMetrics.length > 0
      ? batchMetrics.reduce((sum, batch) => sum + batch.dailyWeightGain, 0) / batchMetrics.length
      : 0;

    const averageFCR = batchMetrics.filter(b => b.feedConversionRatio > 0).length > 0
      ? batchMetrics
          .filter(b => b.feedConversionRatio > 0)
          .reduce((sum, batch) => sum + batch.feedConversionRatio, 0) / 
        batchMetrics.filter(b => b.feedConversionRatio > 0).length
      : 0;

    // Ready for processing
    const readyForProcessing = batchMetrics.filter(batch => batch.isReadyForProcessing);
    const readyCount = readyForProcessing.reduce((sum, batch) => sum + batch.current_count, 0);

    // Health indicators
    const healthMetrics = {
      lowPerformingBatches: batchMetrics.filter(batch => 
        batch.mortalityRate > 10 || batch.dailyWeightGain < 0.05
      ).length,
      highPerformingBatches: batchMetrics.filter(batch => 
        batch.mortalityRate < 5 && batch.dailyWeightGain > 0.08
      ).length,
      averageMortalityRate: batchMetrics.length > 0
        ? batchMetrics.reduce((sum, batch) => sum + batch.mortalityRate, 0) / batchMetrics.length
        : 0
    };

    // Growth trends
    const growthTrends = weightHistory
      .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
      .map((record, index, array) => {
        const previousRecord = array[index - 1];
        const growthRate = previousRecord 
          ? ((record.average_weight - previousRecord.average_weight) / previousRecord.average_weight) * 100
          : 0;
        
        return {
          ...record,
          growthRate
        };
      });

    return {
      // Basic metrics
      totalBatches,
      totalLiveChickens,
      totalInitialChickens,
      totalMortality,
      mortalityRate,
      
      // Performance metrics
      averageAge,
      averageWeight,
      averageDailyGain,
      averageFCR,
      
      // Processing readiness
      readyForProcessing,
      readyCount,
      
      // Health indicators
      healthMetrics,
      
      // Detailed batch metrics
      batchMetrics,
      
      // Growth trends
      growthTrends,
      
      // Formatted values
      formatted: {
        mortalityRate: `${mortalityRate.toFixed(1)}%`,
        averageWeight: `${averageWeight.toFixed(2)} kg`,
        averageDailyGain: `${(averageDailyGain * 1000).toFixed(0)} g/day`,
        averageFCR: averageFCR.toFixed(2),
        readyPercentage: totalLiveChickens > 0 ? `${((readyCount / totalLiveChickens) * 100).toFixed(1)}%` : '0%'
      }
    };
  }, [liveChickens, weightHistory, targetWeight, targetAge]);
}

/**
 * Custom hook for feed analytics and calculations
 * @param {Array} feedInventory - Array of feed inventory items
 * @param {Array} feedConsumption - Array of feed consumption records
 * @param {Array} liveChickens - Array of live chicken batches
 * @param {Object} options - Configuration options
 * @returns {Object} - Feed analytics and calculations
 */
export function useFeedAnalytics(feedInventory = [], feedConsumption = [], liveChickens = [], options = {}) {
  const { alertThreshold = 50, projectionDays = 30 } = options;

  return useMemo(() => {
    // Basic feed metrics
    const totalFeedTypes = feedInventory.length;
    const totalFeedStock = feedInventory.reduce((sum, feed) => sum + (feed.quantity_kg || 0), 0);
    const totalFeedValue = feedInventory.reduce((sum, feed) => {
      const bags = feed.number_of_bags || 0;
      const costPerBag = feed.cost_per_bag || 0;
      return sum + (bags * costPerBag);
    }, 0);

    // Consumption analysis
    const totalConsumption = feedConsumption.reduce((sum, record) => sum + (record.quantity_consumed || 0), 0);
    const dailyConsumption = feedConsumption.length > 0 
      ? totalConsumption / Math.max(1, feedConsumption.length / 7) // Assuming weekly records
      : 0;

    // Feed efficiency by type
    const feedEfficiency = feedInventory.map(feed => {
      const consumptionRecords = feedConsumption.filter(record => record.feed_id === feed.id);
      const totalConsumed = consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0);
      
      // Calculate chickens that consumed this feed
      const consumingBatches = liveChickens.filter(batch => 
        consumptionRecords.some(record => record.chicken_batch_id === batch.id)
      );
      
      const totalChickens = consumingBatches.reduce((sum, batch) => sum + (batch.initial_count || 0), 0);
      const efficiency = totalConsumed > 0 && totalChickens > 0 ? totalChickens / totalConsumed : 0;
      
      // Cost efficiency
      const feedCost = (feed.number_of_bags || 0) * (feed.cost_per_bag || 0);
      const costPerKg = feedCost > 0 && feed.quantity_kg > 0 ? feedCost / feed.quantity_kg : 0;
      const costEfficiency = totalConsumed > 0 ? feedCost / totalConsumed : 0;

      return {
        ...feed,
        totalConsumed,
        totalChickens,
        efficiency,
        costPerKg,
        costEfficiency,
        utilizationRate: feed.quantity_kg > 0 ? (totalConsumed / feed.quantity_kg) * 100 : 0
      };
    });

    // Low stock alerts
    const lowStockAlerts = feedInventory.filter(feed => {
      const currentStock = feed.quantity_kg || 0;
      const threshold = feed.min_threshold || alertThreshold;
      return currentStock <= threshold;
    });

    // Consumption projections
    const projections = feedInventory.map(feed => {
      const consumptionRecords = feedConsumption.filter(record => record.feed_id === feed.id);
      const avgDailyConsumption = consumptionRecords.length > 0
        ? consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0) / Math.max(1, consumptionRecords.length / 7)
        : 0;
      
      const projectedConsumption = avgDailyConsumption * projectionDays;
      const currentStock = feed.quantity_kg || 0;
      const shortfall = Math.max(0, projectedConsumption - currentStock);
      const daysRemaining = avgDailyConsumption > 0 ? currentStock / avgDailyConsumption : Infinity;

      return {
        feedId: feed.id,
        feedType: feed.feed_type,
        brand: feed.brand,
        currentStock,
        avgDailyConsumption,
        projectedConsumption,
        shortfall,
        daysRemaining: daysRemaining === Infinity ? 'Unlimited' : Math.floor(daysRemaining),
        needsReorder: shortfall > 0 || daysRemaining < 7
      };
    });

    // Feed conversion ratios by batch
    const batchFCR = liveChickens.map(batch => {
      const batchConsumption = feedConsumption
        .filter(record => record.chicken_batch_id === batch.id)
        .reduce((sum, record) => sum + record.quantity_consumed, 0);
      
      const weightGain = (batch.current_weight || 0) - (batch.initial_weight || 0);
      const totalWeightGain = weightGain * (batch.current_count || 0);
      
      const fcr = totalWeightGain > 0 ? batchConsumption / totalWeightGain : 0;

      return {
        batchId: batch.batch_id || batch.id,
        breed: batch.breed,
        feedConsumed: batchConsumption,
        weightGain: totalWeightGain,
        fcr,
        efficiency: fcr > 0 ? (1 / fcr) * 100 : 0 // Higher is better
      };
    });

    const averageFCR = batchFCR.filter(b => b.fcr > 0).length > 0
      ? batchFCR.filter(b => b.fcr > 0).reduce((sum, batch) => sum + batch.fcr, 0) / batchFCR.filter(b => b.fcr > 0).length
      : 0;

    return {
      // Basic metrics
      totalFeedTypes,
      totalFeedStock,
      totalFeedValue,
      totalConsumption,
      dailyConsumption,
      
      // Efficiency analysis
      feedEfficiency,
      averageFCR,
      batchFCR,
      
      // Alerts and projections
      lowStockAlerts,
      projections,
      
      // Summary statistics
      summary: {
        mostEfficientFeed: feedEfficiency.length > 0 
          ? feedEfficiency.reduce((max, feed) => feed.efficiency > max.efficiency ? feed : max)
          : null,
        leastEfficientFeed: feedEfficiency.length > 0
          ? feedEfficiency.reduce((min, feed) => feed.efficiency < min.efficiency ? feed : min)
          : null,
        totalAlerts: lowStockAlerts.length,
        reorderNeeded: projections.filter(p => p.needsReorder).length
      },
      
      // Formatted values
      formatted: {
        totalFeedStock: `${totalFeedStock.toFixed(1)} kg`,
        totalFeedValue: `₦${totalFeedValue.toLocaleString()}`,
        dailyConsumption: `${dailyConsumption.toFixed(1)} kg/day`,
        averageFCR: averageFCR.toFixed(2)
      }
    };
  }, [feedInventory, feedConsumption, liveChickens, alertThreshold, projectionDays]);
}

/**
 * Custom hook for inventory calculations and turnover analysis
 * @param {Array} inventory - Array of inventory items
 * @param {Array} transactions - Array of transaction records
 * @param {Object} options - Configuration options
 * @returns {Object} - Inventory metrics and calculations
 */
export function useInventoryCalculations(inventory = [], transactions = [], options = {}) {
  const { period = 30 } = options; // Analysis period in days

  return useMemo(() => {
    const currentDate = new Date();
    const periodStart = new Date(currentDate.getTime() - (period * 24 * 60 * 60 * 1000));

    // Filter transactions for the analysis period
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= periodStart && transactionDate <= currentDate;
    });

    // Calculate inventory turnover for each item
    const inventoryAnalysis = inventory.map(item => {
      // Calculate average inventory (simplified as current stock / 2)
      const currentStock = item.quantity_kg || item.current_stock || 0;
      const averageInventory = currentStock / 2;

      // Calculate consumption/usage from transactions
      const itemTransactions = periodTransactions.filter(t => 
        t.item_id === item.id || t.feed_id === item.id
      );
      
      const totalUsed = itemTransactions.reduce((sum, t) => sum + (t.quantity_consumed || t.quantity || 0), 0);
      
      // Turnover rate
      const turnoverRate = averageInventory > 0 ? totalUsed / averageInventory : 0;
      
      // Days of inventory remaining
      const dailyUsage = totalUsed / period;
      const daysRemaining = dailyUsage > 0 ? currentStock / dailyUsage : Infinity;
      
      // Value calculations
      const unitCost = item.cost_per_bag || item.unit_cost || 0;
      const totalValue = currentStock * unitCost;
      
      // Status determination
      let status = 'normal';
      if (daysRemaining < 7) status = 'critical';
      else if (daysRemaining < 14) status = 'low';
      else if (turnoverRate < 0.5) status = 'slow-moving';
      else if (turnoverRate > 3) status = 'fast-moving';

      return {
        ...item,
        currentStock,
        averageInventory,
        totalUsed,
        turnoverRate,
        daysRemaining: daysRemaining === Infinity ? 'Unlimited' : Math.floor(daysRemaining),
        dailyUsage,
        totalValue,
        status,
        efficiency: turnoverRate > 0 ? 'efficient' : 'inefficient'
      };
    });

    // Summary statistics
    const totalInventoryValue = inventoryAnalysis.reduce((sum, item) => sum + item.totalValue, 0);
    const averageTurnoverRate = inventoryAnalysis.length > 0
      ? inventoryAnalysis.reduce((sum, item) => sum + item.turnoverRate, 0) / inventoryAnalysis.length
      : 0;

    // Categorize items
    const categories = {
      critical: inventoryAnalysis.filter(item => item.status === 'critical'),
      low: inventoryAnalysis.filter(item => item.status === 'low'),
      slowMoving: inventoryAnalysis.filter(item => item.status === 'slow-moving'),
      fastMoving: inventoryAnalysis.filter(item => item.status === 'fast-moving'),
      normal: inventoryAnalysis.filter(item => item.status === 'normal')
    };

    // Performance metrics
    const performanceMetrics = {
      totalItems: inventory.length,
      activeItems: inventoryAnalysis.filter(item => item.turnoverRate > 0).length,
      stagnantItems: inventoryAnalysis.filter(item => item.turnoverRate === 0).length,
      highValueItems: inventoryAnalysis.filter(item => item.totalValue > totalInventoryValue * 0.1).length,
      inventoryHealth: categories.critical.length === 0 && categories.slowMoving.length < inventory.length * 0.2 ? 'good' : 'needs-attention'
    };

    // Recommendations
    const recommendations = [];
    
    if (categories.critical.length > 0) {
      recommendations.push({
        type: 'urgent',
        message: `${categories.critical.length} items are critically low and need immediate restocking`,
        items: categories.critical.map(item => item.name || item.feed_type)
      });
    }
    
    if (categories.slowMoving.length > 0) {
      recommendations.push({
        type: 'optimization',
        message: `${categories.slowMoving.length} items are slow-moving and may need reduced ordering`,
        items: categories.slowMoving.map(item => item.name || item.feed_type)
      });
    }
    
    if (averageTurnoverRate < 1) {
      recommendations.push({
        type: 'efficiency',
        message: 'Overall inventory turnover is below optimal levels',
        suggestion: 'Consider reviewing ordering quantities and consumption patterns'
      });
    }

    return {
      // Detailed analysis
      inventoryAnalysis,
      
      // Summary metrics
      totalInventoryValue,
      averageTurnoverRate,
      
      // Categories
      categories,
      
      // Performance
      performanceMetrics,
      
      // Recommendations
      recommendations,
      
      // Formatted values
      formatted: {
        totalInventoryValue: `₦${totalInventoryValue.toLocaleString()}`,
        averageTurnoverRate: `${averageTurnoverRate.toFixed(2)}x`,
        inventoryHealth: performanceMetrics.inventoryHealth.replace('-', ' ').toUpperCase()
      }
    };
  }, [inventory, transactions, period]);
}
