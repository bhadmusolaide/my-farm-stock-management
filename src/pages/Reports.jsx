import { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import './Reports.css'

const Reports = () => {
  const {
    chickens,
    liveChickens,
    feedInventory,
    transactions,
    balance,
    stats
  } = useAppContext()

  const [viewMode, setViewMode] = useState('monthly') // 'weekly', 'monthly', or 'custom'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Calculate key metrics based on filtered data
  const { keyMetrics, filteredData, revenueChartData, expensesChartData, liveChickensData, customerMetrics } = useMemo(() => {
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
      customerMetrics
    }
  }, [chickens, transactions, liveChickens, feedInventory, balance, viewMode, startDate, endDate])

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
        <h1>Farm Stock Management Reports</h1>
        <p>Key metrics and insights at a glance</p>
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
    </div>
  )
}

export default Reports