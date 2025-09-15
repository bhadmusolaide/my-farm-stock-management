import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import './Reports.css'

const Reports = () => {
  const {
    chickens,
    liveChickens,
    feedInventory,
    transactions,
    balance,
    stats,
    dressedChickens,
    feedConsumption,
    chickenInventoryTransactions
  } = useAppContext()

  const [viewMode, setViewMode] = useState('monthly') // 'weekly', 'monthly', or 'custom'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'profitability', 'seasonal', 'feed', 'customers'

  // Calculate key metrics based on filtered data
  const { keyMetrics, filteredData, revenueChartData, expensesChartData, liveChickensData, customerMetrics, batchProfitability, seasonalTrends, feedEfficiency, customerLifetimeValue, inventoryTurnover, cashFlowData } = useMemo(() => {
    // Determine date range based on view mode
    const now = new Date()
    let filterStartDate = null
    let filterEndDate = null
    
    if (viewMode === 'weekly') {
      // Get start of current week (Monday)
      filterStartDate = new Date(now)
      const day = filterStartDate.getDay()
      const diff = filterStartDate.getDate() - day + (day === 0 ? -6 : 1)
      filterStartDate.setDate(diff)
      filterStartDate.setHours(0, 0, 0, 0)
      
      // End of current week (Sunday)
      filterEndDate = new Date(filterStartDate)
      filterEndDate.setDate(filterEndDate.getDate() + 6)
      filterEndDate.setHours(23, 59, 59, 999)
    } else if (viewMode === 'monthly') {
      // Get start of current month
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
      filterStartDate.setHours(0, 0, 0, 0)
      
      // End of current month
      filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filterEndDate.setHours(23, 59, 59, 999)
    } else if (viewMode === 'custom' && startDate && endDate) {
      filterStartDate = new Date(startDate)
      filterStartDate.setHours(0, 0, 0, 0)
      filterEndDate = new Date(endDate)
      filterEndDate.setHours(23, 59, 59, 999)
    }
    
    // Filter data based on date range
    const filteredChickens = filterStartDate && filterEndDate
      ? chickens.filter(chicken => {
          const chickenDate = new Date(chicken.date)
          return chickenDate >= filterStartDate && chickenDate <= filterEndDate
        })
      : chickens
      
    const filteredTransactions = filterStartDate && filterEndDate
      ? transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date)
          return transactionDate >= filterStartDate && transactionDate <= filterEndDate
        })
      : transactions
    
    // Calculate customer metrics
    const customerMap = new Map()
    filteredChickens.forEach(chicken => {
      const customerId = chicken.customer
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerId,
          orders: 0,
          chickens: 0,
          revenue: 0,
          balance: 0,
          status: { pending: 0, partial: 0, paid: 0 }
        })
      }
      
      const customer = customerMap.get(customerId)
      customer.orders += 1
      customer.chickens += chicken.count
      
      // Calculate revenue for this order
      const orderRevenue = chicken.count * chicken.size * chicken.price
      customer.revenue += orderRevenue
      
      // Add balance
      customer.balance += (chicken.balance || 0)
      
      // Update status counts
      if (chicken.status === 'pending') {
        customer.status.pending += 1
      } else if (chicken.status === 'partial') {
        customer.status.partial += 1
      } else if (chicken.status === 'paid') {
        customer.status.paid += 1
      }
    })
    
    const customerMetrics = Array.from(customerMap.values())
    
    // Calculate financial metrics
    const totalRevenue = filteredChickens.reduce((sum, chicken) => {
      return sum + (chicken.count * chicken.size * chicken.price)
    }, 0)
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .reduce((sum, t) => sum + t.amount, 0)
      
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Funds metrics
    const fundsAdded = filteredTransactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0)
    const fundsWithdrawn = filteredTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0)
    const currentBalance = balance

    // Stock metrics
    const generalStockItems = feedInventory.length
    const generalStockValue = feedInventory.reduce((sum, item) => 
      sum + (item.number_of_bags || 0) * (item.cost_per_bag || 0), 0)

    // Live chicken metrics
    const totalLiveChickens = liveChickens.reduce((sum, batch) => 
      sum + (batch.current_count || 0), 0)
    const totalMortality = liveChickens.reduce((sum, batch) => 
      sum + ((batch.initial_count || 0) - (batch.current_count || 0)), 0)
    const mortalityRate = liveChickens.length > 0 
      ? (totalMortality / liveChickens.reduce((sum, batch) => sum + (batch.initial_count || 0), 0)) * 100 
      : 0

    // Feed metrics
    const totalFeedStock = feedInventory.reduce((sum, item) => 
      sum + (item.quantity_kg || 0), 0)

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
        balance: currentBalance
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
    }

    // Prepare chart data
    const revenueChartData = []
    const revenuePeriodData = {}
    
    filteredChickens.forEach(chicken => {
      const date = new Date(chicken.date)
      let key
      
      if (viewMode === 'weekly') {
        // Group by day for weekly view
        key = formatDate(date)
      } else {
        // Group by week for monthly/custom view
        const weekStart = new Date(date)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        key = `Week of ${formatDate(weekStart)}`
      }
      
      if (!revenuePeriodData[key]) {
        revenuePeriodData[key] = 0
      }
      
      revenuePeriodData[key] += chicken.count * chicken.size * chicken.price
    })
    
    Object.keys(revenuePeriodData).forEach(key => {
      revenueChartData.push({ name: key, revenue: revenuePeriodData[key] })
    })

    const expensesChartData = []
    const expensesPeriodData = {}
    
    filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'stock_expense')
      .forEach(transaction => {
        const date = new Date(transaction.date)
        let key
        
        if (viewMode === 'weekly') {
          // Group by day for weekly view
          key = formatDate(date)
        } else {
          // Group by week for monthly/custom view
          const weekStart = new Date(date)
          const day = weekStart.getDay()
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
          weekStart.setDate(diff)
          key = `Week of ${formatDate(weekStart)}`
        }
        
        if (!expensesPeriodData[key]) {
          expensesPeriodData[key] = 0
        }
        
        expensesPeriodData[key] += transaction.amount
      })
    
    Object.keys(expensesPeriodData).forEach(key => {
      expensesChartData.push({ name: key, expenses: expensesPeriodData[key] })
    })

    const liveChickensData = liveChickens.map(batch => ({
      name: batch.batch_id || `Batch ${batch.id}`,
      count: batch.current_count || 0,
      breed: batch.breed || 'Unknown'
    }))

    // Cash Flow Analysis
    const cashFlowData = [];
    const cashFlowMap = {};
    
    // Group transactions by date
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
    
    // Convert to array and calculate net cash flow
    Object.values(cashFlowMap).forEach(item => {
      cashFlowData.push({
        ...item,
        net: item.income - item.expenses
      });
    });
    
    // Sort by date
    cashFlowData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Advanced Analytics: Batch Profitability Analysis
    const batchProfitability = liveChickens.map(batch => {
      // Find all chicken orders associated with this batch
      const batchOrders = chickens.filter(chicken => chicken.batch_id === batch.id)
      
      // Calculate total revenue from this batch
      const batchRevenue = batchOrders.reduce((sum, order) => {
        return sum + (order.count * order.size * order.price)
      }, 0)
      
      // Calculate feed costs
      const batchFeedConsumption = feedConsumption.filter(consumption => consumption.chicken_batch_id === batch.id);
      const feedCost = batchFeedConsumption.reduce((sum, consumption) => {
        const feedItem = feedInventory.find(feed => feed.id === consumption.feed_id);
        const costPerKg = feedItem ? (feedItem.cost_per_bag || 0) / (feedItem.weight_per_bag_kg || 1) : 0;
        return sum + (consumption.quantity_consumed * costPerKg);
      }, 0);
      
      // Calculate total costs (feed + fixed costs)
      const batchCost = feedCost + (batch.initial_count * 30) // Fixed cost per chicken
      
      // Calculate profitability
      const profit = batchRevenue - batchCost
      const profitMargin = batchRevenue > 0 ? (profit / batchRevenue) * 100 : 0
      
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
      }
    }).sort((a, b) => b.profit - a.profit)

    // Advanced Analytics: Seasonal Performance Trends
    const seasonalTrends = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Group data by month
    const monthlyData = {}
    chickens.forEach(chicken => {
      const date = new Date(chicken.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: months[date.getMonth()],
          year: date.getFullYear(),
          revenue: 0,
          chickens: 0,
          orders: 0,
          avgSize: 0,
          totalSize: 0
        }
      }
      
      monthlyData[monthKey].revenue += chicken.count * chicken.size * chicken.price
      monthlyData[monthKey].chickens += chicken.count
      monthlyData[monthKey].orders += 1
      monthlyData[monthKey].totalSize += chicken.size
    })
    
    // Calculate average size and convert to array
    Object.keys(monthlyData).forEach(key => {
      const monthData = monthlyData[key];
      monthData.avgSize = monthData.chickens > 0 ? monthData.totalSize / monthData.chickens : 0;
      seasonalTrends.push(monthData);
    })
    
    seasonalTrends.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      const aMonthIndex = months.indexOf(a.month)
      const bMonthIndex = months.indexOf(b.month)
      return aMonthIndex - bMonthIndex
    })

    // Advanced Analytics: Feed Efficiency Comparisons
    const feedEfficiency = feedInventory.map(feed => {
      // Find all consumption records for this feed
      const consumptionRecords = feedConsumption.filter(consumption => consumption.feed_id === feed.id)
      const totalConsumed = consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0)
      
      // Find all chicken batches that consumed this feed
      const consumingBatches = liveChickens.filter(batch => 
        consumptionRecords.some(record => record.chicken_batch_id === batch.id)
      )
      
      const totalChickens = consumingBatches.reduce((sum, batch) => sum + batch.initial_count, 0)
      
      // Calculate efficiency (chickens per kg of feed)
      const efficiency = totalConsumed > 0 ? totalChickens / totalConsumed : 0
      
      // Calculate cost efficiency (revenue per kg of feed)
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
      }
    }).sort((a, b) => b.efficiency - a.efficiency)

    // Advanced Analytics: Customer Lifetime Value Tracking
    const customerLifetimeValue = customerMetrics.map(customer => {
      // Calculate average order value
      const avgOrderValue = customer.orders > 0 ? customer.revenue / customer.orders : 0
      
      // Calculate frequency (orders per month - simplified)
      const frequency = customer.orders / 3 // Assuming 3 months of data
      
      // Calculate customer lifetime value (simplified model)
      const clv = avgOrderValue * frequency * 12 // Annual value
      
      // Calculate customer retention rate (simplified)
      const retentionRate = Math.min(100, (customer.orders / 12) * 100); // Simplified retention rate
      
      return {
        name: customer.name,
        totalRevenue: customer.revenue,
        totalOrders: customer.orders,
        avgOrderValue,
        frequency,
        clv,
        retentionRate,
        outstandingBalance: customer.balance
      }
    }).sort((a, b) => b.clv - a.clv)

    // Inventory Turnover Analysis
    const inventoryTurnover = feedInventory.map(item => {
      const consumptionRecords = feedConsumption.filter(consumption => consumption.feed_id === item.id);
      const totalConsumed = consumptionRecords.reduce((sum, record) => sum + record.quantity_consumed, 0);
      
      // Calculate average inventory (simplified)
      const avgInventory = (item.quantity_kg || 0) / 2;
      
      // Calculate turnover rate (times per period)
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
      filteredData: {
        chickens: filteredChickens,
        transactions: filteredTransactions,
        liveChickens,
        feedInventory
      },
      revenueChartData,
      expensesChartData,
      liveChickensData,
      customerMetrics,
      batchProfitability,
      seasonalTrends,
      feedEfficiency,
      customerLifetimeValue,
      inventoryTurnover,
      cashFlowData
    }
  }, [chickens, transactions, liveChickens, feedInventory, balance, viewMode, startDate, endDate, dressedChickens, feedConsumption, chickenInventoryTransactions])

  // Handle date range change
  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setViewMode('custom')
    }
  }

  // Reset to default view
  const resetView = () => {
    setViewMode('monthly')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Advanced Farm Stock Management Reports</h1>
        <p>Comprehensive analytics and insights</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'profitability' ? 'active' : ''}`}
          onClick={() => setActiveTab('profitability')}
        >
          Batch Profitability
        </button>
        <button 
          className={`tab-btn ${activeTab === 'seasonal' ? 'active' : ''}`}
          onClick={() => setActiveTab('seasonal')}
        >
          Seasonal Trends
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          Feed Efficiency
        </button>
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Value
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          Cash Flow
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Analysis
        </button>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <div className="toggle-container">
          <button 
            className={`toggle-button ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </button>
          <button 
            className={`toggle-button ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly View
          </button>
          <button 
            className={`toggle-button ${viewMode === 'custom' ? 'active' : ''}`}
            onClick={() => setViewMode('custom')}
          >
            Custom Range
          </button>
        </div>
        
        {viewMode === 'custom' && (
          <div className="date-range-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={handleDateRangeChange}
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onBlur={handleDateRangeChange}
            />
            <button onClick={resetView} className="btn-secondary">Reset</button>
          </div>
        )}
        
        <p className="view-description">
          {viewMode === 'weekly' 
            ? 'Showing data for the current week'
            : viewMode === 'monthly'
            ? 'Showing data for the current month'
            : startDate && endDate
            ? `Showing data from ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
            : 'Select a date range'}
        </p>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Overview */}
          <div className="metrics-overview">
            <div className="metrics-grid">
              {/* Financial Metrics */}
              <div className="metric-card financial">
                <div className="metric-header">
                  <h3>💰 Financial Overview</h3>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Revenue</span>
                    <span className="metric-value">{formatCurrency(keyMetrics.financial.revenue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Expenses</span>
                    <span className="metric-value">{formatCurrency(keyMetrics.financial.expenses)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Net Profit</span>
                    <span className={`metric-value ${keyMetrics.financial.profit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(keyMetrics.financial.profit)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Profit Margin</span>
                    <span className="metric-value">
                      {keyMetrics.financial.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Funds Metrics */}
              <div className="metric-card funds">
                <div className="metric-header">
                  <h3>💳 Funds Management</h3>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Funds Added</span>
                    <span className="metric-value positive">+{formatCurrency(keyMetrics.funds.added)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Funds Withdrawn</span>
                    <span className="metric-value negative">-{formatCurrency(keyMetrics.funds.withdrawn)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Current Balance</span>
                    <span className="metric-value">{formatCurrency(keyMetrics.funds.balance)}</span>
                  </div>
                </div>
              </div>

              {/* Stock Metrics */}
              <div className="metric-card stock">
                <div className="metric-header">
                  <h3>📦 General Stock</h3>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Items in Stock</span>
                    <span className="metric-label">Items in Stock</span>
                    <span className="metric-value">{formatNumber(keyMetrics.stock.items)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Stock Value</span>
                    <span className="metric-value">{formatCurrency(keyMetrics.stock.value)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Feed Stock</span>
                    <span className="metric-value">{formatNumber(keyMetrics.feed.stock, 1)} kg</span>
                  </div>
                </div>
              </div>

              {/* Customer Metrics */}
              <div className="metric-card customers">
                <div className="metric-header">
                  <h3>👥 Customer Overview</h3>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Total Customers</span>
                    <span className="metric-value">{formatNumber(keyMetrics.customers.total)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Outstanding Balance</span>
                    <span className="metric-value">{formatCurrency(keyMetrics.customers.outstandingBalance)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Pending Orders</span>
                    <span className="metric-value">{formatNumber(keyMetrics.customers.pending)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Partially Paid</span>
                    <span className="metric-value">{formatNumber(keyMetrics.customers.partial)}</span>
                  </div>
                </div>
              </div>

              {/* Live Chicken Metrics */}
              <div className="metric-card livestock">
                <div className="metric-header">
                  <h3>🐔 Live Chicken Stock</h3>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Total Chickens</span>
                    <span className="metric-value">{formatNumber(keyMetrics.liveChickens.total)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Mortality</span>
                    <span className="metric-value">{formatNumber(keyMetrics.liveChickens.mortality)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Mortality Rate</span>
                    <span className="metric-value">{keyMetrics.liveChickens.mortalityRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <h3>Revenue Trend</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No revenue data available for the selected period</p>
              )}
            </div>

            <div className="chart-container">
              <h3>Expenses Trend</h3>
              {expensesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expensesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Expenses']} />
                    <Legend />
                    <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No expense data available for the selected period</p>
              )}
            </div>

            <div className="chart-container">
              <h3>Live Chicken Stock Distribution</h3>
              {liveChickensData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={liveChickensData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {liveChickensData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value), 'Chickens']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No live chicken data available</p>
              )}
            </div>
          </div>

          {/* Quick Summary */}
          <div className="quick-summary">
            <h2>Quick Summary</h2>
            <div className="summary-content">
              <p>
                <strong>Performance:</strong> {keyMetrics.financial.profit >= 0 ? 'Profitable' : 'Loss-making'} with a {keyMetrics.financial.profitMargin.toFixed(1)}% margin
              </p>
              <p>
                <strong>Liquidity:</strong> Current balance of {formatCurrency(keyMetrics.funds.balance)} ({keyMetrics.funds.added > keyMetrics.funds.withdrawn ? 'positive' : 'negative'} cash flow)
              </p>
              <p>
                <strong>Inventory:</strong> {formatNumber(keyMetrics.stock.items)} stock items valued at {formatCurrency(keyMetrics.stock.value)}
              </p>
              <p>
                <strong>Customers:</strong> {formatNumber(keyMetrics.customers.total)} customers with {formatCurrency(keyMetrics.customers.outstandingBalance)} outstanding balance
              </p>
              <p>
                <strong>Livestock:</strong> {formatNumber(keyMetrics.liveChickens.total)} chickens with {keyMetrics.liveChickens.mortalityRate.toFixed(1)}% mortality rate
              </p>
            </div>
          </div>
        </>
      )}

      {/* Batch Profitability Tab */}
      {activeTab === 'profitability' && (
        <div className="analytics-section">
          <h2>Batch Profitability Analysis</h2>
          <p>Compare profitability across different chicken batches</p>
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Breed</th>
                  <th>Initial Count</th>
                  <th>Current Count</th>
                  <th>Mortality Rate</th>
                  <th>Revenue</th>
                  <th>Total Cost</th>
                  <th>Feed Cost</th>
                  <th>Profit</th>
                  <th>Profit Margin</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batchProfitability.map((batch, index) => (
                  <tr key={index}>
                    <td>{batch.batchId}</td>
                    <td>{batch.breed}</td>
                    <td>{formatNumber(batch.initialCount)}</td>
                    <td>{formatNumber(batch.currentCount)}</td>
                    <td>{batch.mortalityRate.toFixed(1)}%</td>
                    <td>{formatCurrency(batch.revenue)}</td>
                    <td>{formatCurrency(batch.cost)}</td>
                    <td>{formatCurrency(batch.feedCost)}</td>
                    <td className={batch.profit >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(batch.profit)}
                    </td>
                    <td className={batch.profitMargin >= 0 ? 'positive' : 'negative'}>
                      {batch.profitMargin.toFixed(1)}%
                    </td>
                    <td>
                      <span className={`status-badge ${batch.status}`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {batchProfitability.length > 0 && (
            <div className="chart-container">
              <h3>Top Performing Batches</h3>
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
          
          {batchProfitability.length > 0 && (
            <div className="chart-container">
              <h3>Batch Performance Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={batchProfitability.slice(0, 5).map(batch => ({
                  batchId: batch.batchId,
                  revenue: batch.revenue / 1000, // Scale for radar chart
                  profit: batch.profit / 1000,
                  efficiency: batch.currentCount / batch.initialCount * 100
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="batchId" />
                  <PolarRadiusAxis />
                  <Radar name="Revenue (x1000)" dataKey="revenue" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                  <Radar name="Profit (x1000)" dataKey="profit" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Seasonal Trends Tab */}
      {activeTab === 'seasonal' && (
        <div className="analytics-section">
          <h2>Seasonal Performance Trends</h2>
          <p>Analyze performance patterns across different months</p>
          
          {seasonalTrends.length > 0 && (
            <div className="chart-container">
              <h3>Monthly Revenue Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4caf50" 
                    name="Revenue" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {seasonalTrends.length > 0 && (
            <div className="chart-container">
              <h3>Chickens Sold by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Chickens']} />
                  <Legend />
                  <Bar dataKey="chickens" fill="#ff9800" name="Chickens Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>Chickens Sold</th>
                  <th>Avg Size (kg)</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {seasonalTrends.map((trend, index) => (
                  <tr key={index}>
                    <td>{trend.month}</td>
                    <td>{trend.year}</td>
                    <td>{formatCurrency(trend.revenue)}</td>
                    <td>{formatNumber(trend.chickens)}</td>
                    <td>{trend.avgSize.toFixed(2)} kg</td>
                    <td>{formatNumber(trend.orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feed Efficiency Tab */}
      {activeTab === 'feed' && (
        <div className="analytics-section">
          <h2>Feed Efficiency Comparisons</h2>
          <p>Compare feed efficiency across different feed types and brands</p>
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Feed Type</th>
                  <th>Brand</th>
                  <th>Total Consumed (kg)</th>
                  <th>Chickens Fed</th>
                  <th>Efficiency (Chickens/kg)</th>
                  <th>Cost Efficiency (Revenue/kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedEfficiency.map((feed, index) => (
                  <tr key={index}>
                    <td>{feed.feedType}</td>
                    <td>{feed.brand}</td>
                    <td>{formatNumber(feed.totalConsumed, 1)}</td>
                    <td>{formatNumber(feed.totalChickens)}</td>
                    <td>{feed.efficiency.toFixed(2)}</td>
                    <td>{formatCurrency(feed.costEfficiency)}</td>
                    <td>
                      <span className={`status-badge ${feed.status}`}>
                        {feed.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {feedEfficiency.length > 0 && (
            <div className="chart-container">
              <h3>Feed Efficiency Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feedType" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'efficiency') {
                      return [value.toFixed(2), 'Chickens/kg']
                    } else if (name === 'costEfficiency') {
                      return [formatCurrency(value), 'Revenue/kg']
                    }
                    return [formatNumber(value, 1), name === 'totalConsumed' ? 'kg' : 'Chickens']
                  }} />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#ff9800" name="Efficiency (Chickens/kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {feedEfficiency.length > 0 && (
            <div className="chart-container">
              <h3>Feed Cost Efficiency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feedType" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue/kg']} />
                  <Legend />
                  <Bar dataKey="costEfficiency" fill="#9c27b0" name="Cost Efficiency (Revenue/kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Customer Lifetime Value Tab */}
      {activeTab === 'customers' && (
        <div className="analytics-section">
          <h2>Customer Lifetime Value Tracking</h2>
          <p>Track customer value and retention metrics</p>
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Revenue</th>
                  <th>Total Orders</th>
                  <th>Avg Order Value</th>
                  <th>Frequency (orders/month)</th>
                  <th>Customer Lifetime Value</th>
                  <th>Retention Rate</th>
                  <th>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {customerLifetimeValue.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.name}</td>
                    <td>{formatCurrency(customer.totalRevenue)}</td>
                    <td>{formatNumber(customer.totalOrders)}</td>
                    <td>{formatCurrency(customer.avgOrderValue)}</td>
                    <td>{customer.frequency.toFixed(1)}</td>
                    <td>{formatCurrency(customer.clv)}</td>
                    <td>{customer.retentionRate.toFixed(1)}%</td>
                    <td>{formatCurrency(customer.outstandingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {customerLifetimeValue.length > 0 && (
            <div className="chart-container">
              <h3>Top Value Customers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerLifetimeValue.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Bar dataKey="clv" fill="#9c27b0" name="Customer Lifetime Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {customerLifetimeValue.length > 0 && (
            <div className="chart-container">
              <h3>Customer Retention Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerLifetimeValue.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Retention Rate']} />
                  <Legend />
                  <Bar dataKey="retentionRate" fill="#2196f3" name="Retention Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <div className="analytics-section">
          <h2>Cash Flow Analysis</h2>
          <p>Track income, expenses, and net cash flow over time</p>
          
          {cashFlowData.length > 0 && (
            <div className="chart-container">
              <h3>Cash Flow Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} name="Income" />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#f44336" fill="#f44336" fillOpacity={0.3} name="Expenses" />
                  <Area type="monotone" dataKey="net" stackId="3" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} name="Net Cash Flow" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td className="positive">{formatCurrency(item.income)}</td>
                    <td className="negative">{formatCurrency(item.expenses)}</td>
                    <td className={item.net >= 0 ? 'positive' : 'negative'}>{formatCurrency(item.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Analysis Tab */}
      {activeTab === 'inventory' && (
        <div className="analytics-section">
          <h2>Inventory Turnover Analysis</h2>
          <p>Analyze how efficiently inventory is being used</p>
          
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Feed Type</th>
                  <th>Current Stock (kg)</th>
                  <th>Consumed (kg)</th>
                  <th>Turnover Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryTurnover.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{formatNumber(item.currentStock, 1)}</td>
                    <td>{formatNumber(item.totalConsumed, 1)}</td>
                    <td>{item.turnoverRate.toFixed(2)}x</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {inventoryTurnover.length > 0 && (
            <div className="chart-container">
              <h3>Inventory Turnover Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}x`, 'Turnover Rate']} />
                  <Legend />
                  <Bar dataKey="turnoverRate" fill="#ff9800" name="Turnover Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {inventoryTurnover.length > 0 && (
            <div className="chart-container">
              <h3>Stock Levels vs Consumption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'currentStock') {
                      return [formatNumber(value, 1), 'kg (Current Stock)']
                    } else if (name === 'totalConsumed') {
                      return [formatNumber(value, 1), 'kg (Consumed)']
                    }
                    return [value, name]
                  }} />
                  <Legend />
                  <Bar dataKey="currentStock" fill="#2196f3" name="Current Stock (kg)" />
                  <Bar dataKey="totalConsumed" fill="#f44336" name="Consumed (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports