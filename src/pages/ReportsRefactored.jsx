import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TabNavigation } from '../components/UI';
import { formatDate, getAggregatedReportData } from '../utils/formatters';
import { supabase } from '../utils/supabaseClient';
import {
  ReportFilters,
  OverviewDashboard,
  BatchProfitabilityAnalysis,
  SeasonalTrendsAnalysis,
  FeedEfficiencyAnalysis,
  CustomerAnalysis,
  CashFlowAnalysis,
  InventoryAnalysis
} from '../components/Reports';
import './Reports.css';

const Reports = () => {
  const {
    chickens,
    liveChickens,
    feedInventory,
    transactions,
    balance,
    dressedChickens,
    feedConsumption,
    chickenInventoryTransactions
  } = useAppContext();

  // State management
  const [viewMode, setViewMode] = useState('monthly'); // 'weekly', 'monthly', or 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [aggregatedData, setAggregatedData] = useState(null);
  const [loadingAggregated, setLoadingAggregated] = useState(false);

  // Load aggregated data for better performance
  useEffect(() => {
    const loadAggregatedData = async () => {
      if (viewMode === 'custom' && startDate && endDate) {
        setLoadingAggregated(true);
        try {
          const aggregated = await getAggregatedReportData(supabase, startDate, endDate);
          setAggregatedData(aggregated);
        } catch (error) {
          console.error('Error loading aggregated data:', error);
        } finally {
          setLoadingAggregated(false);
        }
      }
    };

    loadAggregatedData();
  }, [viewMode, startDate, endDate]);

  // Tab configuration
  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'profitability', label: 'Batch Profitability', icon: '🎯' },
    { key: 'seasonal', label: 'Seasonal Trends', icon: '📅' },
    { key: 'feed', label: 'Feed Efficiency', icon: '🌾' },
    { key: 'customers', label: 'Customer Value', icon: '👥' },
    { key: 'cashflow', label: 'Cash Flow', icon: '💰' },
    { key: 'inventory', label: 'Inventory Analysis', icon: '📦' }
  ];

  // Calculate comprehensive analytics data
  const analyticsData = useMemo(() => {
    // Determine date range based on view mode
    const now = new Date();
    let filterStartDate = null;
    let filterEndDate = null;
    
    if (viewMode === 'weekly') {
      // Get start of current week (Monday)
      filterStartDate = new Date(now);
      const day = filterStartDate.getDay();
      const diff = filterStartDate.getDate() - day + (day === 0 ? -6 : 1);
      filterStartDate.setDate(diff);
      filterStartDate.setHours(0, 0, 0, 0);
      
      // End of current week (Sunday)
      filterEndDate = new Date(filterStartDate);
      filterEndDate.setDate(filterEndDate.getDate() + 6);
      filterEndDate.setHours(23, 59, 59, 999);
    } else if (viewMode === 'monthly') {
      // Get start of current month
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      filterStartDate.setHours(0, 0, 0, 0);
      
      // End of current month
      filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filterEndDate.setHours(23, 59, 59, 999);
    } else if (viewMode === 'custom' && startDate && endDate) {
      filterStartDate = new Date(startDate);
      filterStartDate.setHours(0, 0, 0, 0);
      filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
    }
    
    // Filter data based on date range
    const filteredChickens = filterStartDate && filterEndDate
      ? chickens.filter(chicken => {
          const chickenDate = new Date(chicken.date);
          return chickenDate >= filterStartDate && chickenDate <= filterEndDate;
        })
      : chickens;
      
    const filteredTransactions = filterStartDate && filterEndDate
      ? transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= filterStartDate && transactionDate <= filterEndDate;
        })
      : transactions;

    // Calculate key metrics
    const totalRevenue = filteredChickens.reduce((sum, chicken) => {
      return sum + (chicken.count * chicken.size * chicken.price);
    }, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Funds metrics
    const fundsAdded = filteredTransactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0);
    const fundsWithdrawn = filteredTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    // Stock metrics
    const generalStockItems = feedInventory.length;
    const generalStockValue = feedInventory.reduce((sum, item) => 
      sum + (item.number_of_bags || 0) * (item.cost_per_bag || 0), 0);

    // Live chicken metrics
    const totalLiveChickens = liveChickens.reduce((sum, batch) => 
      sum + (batch.current_count || 0), 0);
    const totalMortality = liveChickens.reduce((sum, batch) => 
      sum + ((batch.initial_count || 0) - (batch.current_count || 0)), 0);
    const mortalityRate = liveChickens.length > 0 
      ? (totalMortality / liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0)) * 100 
      : 0;

    // Feed metrics
    const totalFeedStock = feedInventory.reduce((sum, item) => 
      sum + (item.quantity_kg || 0), 0);

    // Customer metrics
    const customerMap = new Map();
    filteredChickens.forEach(chicken => {
      const customerId = chicken.customer;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerId,
          orders: 0,
          chickens: 0,
          revenue: 0,
          balance: 0,
          status: { pending: 0, partial: 0, paid: 0 }
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.orders += 1;
      customer.chickens += chicken.count;
      
      const orderRevenue = chicken.count * chicken.size * chicken.price;
      customer.revenue += orderRevenue;
      customer.balance += (chicken.balance || 0);
      
      if (chicken.status === 'pending') {
        customer.status.pending += 1;
      } else if (chicken.status === 'partial') {
        customer.status.partial += 1;
      } else if (chicken.status === 'paid') {
        customer.status.paid += 1;
      }
    });

    const customerMetrics = Array.from(customerMap.values());

    const keyMetrics = {
      financial: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
        profitMargin
      },
      funds: {
        added: fundsAdded,
        withdrawn: fundsWithdrawn,
        balance: balance
      },
      stock: {
        items: generalStockItems,
        value: generalStockValue
      },
      liveChickens: {
        total: totalLiveChickens,
        mortality: totalMortality,
        mortalityRate
      },
      feed: {
        stock: totalFeedStock
      },
      customers: {
        total: customerMetrics.length,
        outstandingBalance: customerMetrics.reduce((sum, customer) => sum + customer.balance, 0),
        pending: customerMetrics.reduce((sum, customer) => sum + customer.status.pending, 0),
        partial: customerMetrics.reduce((sum, customer) => sum + customer.status.partial, 0),
        paid: customerMetrics.reduce((sum, customer) => sum + customer.status.paid, 0)
      }
    };

    // Prepare chart data
    const revenueChartData = [];
    const revenuePeriodData = {};
    
    filteredChickens.forEach(chicken => {
      const date = new Date(chicken.date);
      let key;
      
      if (viewMode === 'weekly') {
        key = formatDate(date);
      } else {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        key = `Week of ${formatDate(weekStart)}`;
      }
      
      if (!revenuePeriodData[key]) {
        revenuePeriodData[key] = 0;
      }
      
      revenuePeriodData[key] += chicken.count * chicken.size * chicken.price;
    });
    
    Object.keys(revenuePeriodData).forEach(key => {
      revenueChartData.push({ name: key, revenue: revenuePeriodData[key] });
    });

    const expensesChartData = [];
    const expensesPeriodData = {};
    
    filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .forEach(transaction => {
        const date = new Date(transaction.date);
        let key;
        
        if (viewMode === 'weekly') {
          key = formatDate(date);
        } else {
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          key = `Week of ${formatDate(weekStart)}`;
        }
        
        if (!expensesPeriodData[key]) {
          expensesPeriodData[key] = 0;
        }
        
        expensesPeriodData[key] += transaction.amount;
      });
    
    Object.keys(expensesPeriodData).forEach(key => {
      expensesChartData.push({ name: key, expenses: expensesPeriodData[key] });
    });

    const liveChickensData = liveChickens.map(batch => ({
      name: batch.batch_id || `Batch ${batch.id}`,
      count: batch.current_count || 0,
      breed: batch.breed || 'Unknown'
    }));

    // Calculate batch profitability
    const batchProfitability = liveChickens.map(batch => {
      const batchOrders = chickens.filter(chicken => chicken.batch_id === batch.id);
      const batchRevenue = batchOrders.reduce((sum, order) => {
        return sum + (order.count * order.size * order.price);
      }, 0);

      const batchFeedConsumption = feedConsumption.filter(consumption => consumption.chicken_batch_id === batch.id);
      const feedCost = batchFeedConsumption.reduce((sum, consumption) => {
        const feedItem = feedInventory.find(feed => feed.id === consumption.feed_id);
        const costPerKg = feedItem ? (feedItem.cost_per_bag || 0) / (feedItem.weight_per_bag_kg || 1) : 0;
        return sum + (consumption.quantity_consumed * costPerKg);
      }, 0);

      const batchCost = feedCost + (batch.initial_count * 30);
      const profit = batchRevenue - batchCost;
      const profitMargin = batchRevenue > 0 ? (profit / batchRevenue) * 100 : 0;

      return {
        batchId: batch.batch_id || `Batch ${batch.id}`,
        breed: batch.breed,
        initialCount: batch.initial_count,
        currentCount: batch.current_count,
        mortalityRate: batch.initial_count > 0 ?
          ((batch.initial_count - (batch.current_count || 0)) / batch.initial_count) * 100 : 0,
        revenue: batchRevenue,
        cost: batchCost,
        feedCost: feedCost,
        profit,
        profitMargin,
        status: batch.status
      };
    }).sort((a, b) => b.profit - a.profit);

    // Calculate seasonal trends
    const seasonalTrends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    chickens.forEach(chicken => {
      const date = new Date(chicken.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: months[date.getMonth()],
          year: date.getFullYear(),
          revenue: 0,
          chickens: 0,
          orders: 0,
          avgSize: 0,
          totalSize: 0
        };
      }

      monthlyData[monthKey].revenue += chicken.count * chicken.size * chicken.price;
      monthlyData[monthKey].chickens += chicken.count;
      monthlyData[monthKey].orders += 1;
      monthlyData[monthKey].totalSize += chicken.size;
    });

    Object.keys(monthlyData).forEach(key => {
      const monthData = monthlyData[key];
      monthData.avgSize = monthData.chickens > 0 ? monthData.totalSize / monthData.chickens : 0;
      seasonalTrends.push(monthData);
    });

    seasonalTrends.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const aMonthIndex = months.indexOf(a.month);
      const bMonthIndex = months.indexOf(b.month);
      return aMonthIndex - bMonthIndex;
    });

    // Calculate feed efficiency
    const feedEfficiency = feedInventory.map(feed => {
      const consumptionRecords = feedConsumption.filter(consumption => consumption.feed_id === feed.id);
      const totalConsumed = consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0);

      const consumingBatches = liveChickens.filter(batch =>
        consumptionRecords.some(record => record.chicken_batch_id === batch.id)
      );

      const totalChickens = consumingBatches.reduce((sum, batch) => sum + batch.initial_count, 0);
      const efficiency = totalConsumed > 0 ? totalChickens / totalConsumed : 0;

      const batchRevenues = consumingBatches.map(batch => {
        const batchOrders = chickens.filter(chicken => chicken.batch_id === batch.id);
        return batchOrders.reduce((sum, order) => sum + (order.count * order.size * order.price), 0);
      });

      const totalRevenue = batchRevenues.reduce((sum, rev) => sum + rev, 0);
      const costEfficiency = totalConsumed > 0 ? totalRevenue / totalConsumed : 0;

      return {
        feedType: feed.feed_type,
        brand: feed.brand,
        totalConsumed,
        totalChickens,
        efficiency,
        costEfficiency,
        status: feed.status
      };
    }).sort((a, b) => b.efficiency - a.efficiency);

    // Calculate customer lifetime value
    const customerLifetimeValue = customerMetrics.map(customer => {
      const avgOrderValue = customer.orders > 0 ? customer.revenue / customer.orders : 0;
      const frequency = customer.orders / 3;
      const clv = avgOrderValue * frequency * 12;
      const retentionRate = Math.min(100, (customer.orders / 12) * 100);

      return {
        name: customer.name,
        totalRevenue: customer.revenue,
        totalOrders: customer.orders,
        avgOrderValue,
        frequency,
        clv,
        retentionRate,
        outstandingBalance: customer.balance
      };
    }).sort((a, b) => b.clv - a.clv);

    // Calculate cash flow data
    const cashFlowData = [];
    const cashFlowMap = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = formatDate(date);

      if (!cashFlowMap[dateKey]) {
        cashFlowMap[dateKey] = { date: dateKey, income: 0, expenses: 0 };
      }

      if (transaction.type === 'fund' || transaction.type === 'sale') {
        cashFlowMap[dateKey].income += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'stock_expense' || transaction.type === 'withdrawal') {
        cashFlowMap[dateKey].expenses += transaction.amount;
      }
    });

    Object.values(cashFlowMap).forEach(item => {
      cashFlowData.push({
        ...item,
        net: item.income - item.expenses
      });
    });

    cashFlowData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate inventory turnover
    const inventoryTurnover = feedInventory.map(item => {
      const consumptionRecords = feedConsumption.filter(consumption => consumption.feed_id === item.id);
      const totalConsumed = consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0);
      const avgInventory = (item.quantity_kg || 0) / 2;
      const turnoverRate = avgInventory > 0 ? totalConsumed / avgInventory : 0;

      return {
        name: `${item.feed_type} - ${item.brand}`,
        currentStock: item.quantity_kg || 0,
        totalConsumed,
        turnoverRate,
        status: item.status
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);

    return {
      keyMetrics,
      revenueChartData,
      expensesChartData,
      liveChickensData,
      customerMetrics,
      filteredChickens,
      filteredTransactions,
      batchProfitability,
      seasonalTrends,
      feedEfficiency,
      customerLifetimeValue,
      cashFlowData,
      inventoryTurnover
    };
  }, [chickens, transactions, liveChickens, feedInventory, balance, viewMode, startDate, endDate]);

  // Event handlers
  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setViewMode('custom');
    }
  };

  const resetView = () => {
    setViewMode('monthly');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="reports-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 Advanced Farm Stock Management Reports</h1>
        <p>Comprehensive analytics and insights for data-driven decisions</p>
      </div>

      {/* Report Filters */}
      <ReportFilters
        viewMode={viewMode}
        setViewMode={setViewMode}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onDateRangeChange={handleDateRangeChange}
        onResetView={resetView}
      />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        showIcons
      />

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewDashboard
            keyMetrics={analyticsData.keyMetrics}
            revenueChartData={analyticsData.revenueChartData}
            expensesChartData={analyticsData.expensesChartData}
            liveChickensData={analyticsData.liveChickensData}
          />
        )}

        {activeTab === 'profitability' && (
          <BatchProfitabilityAnalysis
            batchProfitability={analyticsData.batchProfitability}
          />
        )}

        {activeTab === 'seasonal' && (
          <SeasonalTrendsAnalysis
            seasonalTrends={analyticsData.seasonalTrends}
          />
        )}

        {activeTab === 'feed' && (
          <FeedEfficiencyAnalysis
            feedEfficiency={analyticsData.feedEfficiency}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerAnalysis
            customerLifetimeValue={analyticsData.customerLifetimeValue}
          />
        )}

        {activeTab === 'cashflow' && (
          <CashFlowAnalysis
            cashFlowData={analyticsData.cashFlowData}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryAnalysis
            inventoryTurnover={analyticsData.inventoryTurnover}
          />
        )}
      </div>

      {/* Loading indicator for aggregated data */}
      {loadingAggregated && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <p>Loading aggregated data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
